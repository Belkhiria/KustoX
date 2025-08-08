"use strict";
/**
 * Connection tree provider for managing Kusto connections
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionTreeProvider = exports.ConnectionTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const sdkManager_1 = require("../kusto/sdkManager");
class ConnectionTreeItem extends vscode.TreeItem {
    constructor(item, collapsibleState) {
        super(item.name, collapsibleState);
        this.item = item;
        this.collapsibleState = collapsibleState;
        this.contextValue = item.type;
        if (item.type === 'cluster') {
            this.iconPath = new vscode.ThemeIcon('server-environment');
            if (item.alias) {
                this.tooltip = `${item.alias} (${item.cluster || item.name})`;
            }
            else {
                this.tooltip = `Cluster: ${item.name}`;
            }
        }
        else if (item.type === 'database') {
            this.iconPath = new vscode.ThemeIcon('database');
            this.tooltip = `Database: ${item.name}`;
            this.command = {
                command: 'kustox.connectToDatabase',
                title: 'Connect to Database',
                arguments: [this]
            };
        }
        else if (item.type === 'table') {
            this.iconPath = new vscode.ThemeIcon('table');
            this.tooltip = `Table: ${item.name}`;
            this.command = {
                command: 'kustox.insertTableName',
                title: 'Insert Table Name',
                arguments: [this]
            };
        }
    }
}
exports.ConnectionTreeItem = ConnectionTreeItem;
class ConnectionTreeProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.connections = [];
        this.clusterClients = new Map(); // Store authenticated clients
        this.tableCache = new Map(); // Cache tables per database
        this.loadConnections();
        this.loadTableCache();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root level - return clusters or welcome message
            if (this.connections.length === 0) {
                // Return a welcome item when no clusters are configured
                const welcomeItem = {
                    type: 'cluster',
                    name: 'Click + to add your first cluster'
                };
                const treeItem = new ConnectionTreeItem(welcomeItem, vscode.TreeItemCollapsibleState.None);
                treeItem.contextValue = 'welcome';
                treeItem.iconPath = new vscode.ThemeIcon('info');
                treeItem.tooltip = 'Add a Kusto cluster to get started';
                return Promise.resolve([treeItem]);
            }
            return Promise.resolve(this.connections.map(item => new ConnectionTreeItem(item, item.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)));
        }
        else {
            // Handle different types of children
            if (element.item.type === 'cluster') {
                // Return databases for clusters
                const children = element.item.children || [];
                return Promise.resolve(children.map(child => new ConnectionTreeItem(child, vscode.TreeItemCollapsibleState.Collapsed) // Always make databases expandable
                ));
            }
            else if (element.item.type === 'database') {
                // Return tables for databases (discover them dynamically)
                if (element.item.cluster && element.item.database) {
                    // Check cache first
                    const cacheKey = `${element.item.cluster}:${element.item.database}`;
                    const cachedTables = this.tableCache.get(cacheKey);
                    if (cachedTables && cachedTables.length > 0) {
                        return Promise.resolve(cachedTables.map(table => new ConnectionTreeItem(table, vscode.TreeItemCollapsibleState.None)));
                    }
                    const hasClient = this.clusterClients.has(element.item.cluster);
                    if (!hasClient) {
                        // Show progress while connecting for table discovery
                        return vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: "Connecting for table discovery...",
                            cancellable: false
                        }, async (progress) => {
                            progress.report({ increment: 0, message: "Loading Kusto SDK..." });
                            try {
                                await (0, sdkManager_1.loadKustoSDK)();
                                progress.report({ increment: 30, message: "Authenticating..." });
                                const KustoConnectionStringBuilder = (0, sdkManager_1.getKustoConnectionStringBuilder)();
                                const KustoClient = (0, sdkManager_1.getKustoClient)();
                                // Use direct browser authentication (same as main connection)
                                const kcsb = KustoConnectionStringBuilder.withUserPrompt(element.item.cluster);
                                const client = new KustoClient(kcsb);
                                progress.report({ increment: 60, message: "Testing connection..." });
                                // Test the connection first to trigger authentication
                                await client.execute(element.item.database, 'print "Table discovery auth test"');
                                progress.report({ increment: 80, message: "Discovering tables..." });
                                // Store the authenticated client
                                this.clusterClients.set(element.item.cluster, client);
                                const tables = await this.discoverTables(element.item.cluster, element.item.database);
                                progress.report({ increment: 100, message: "Tables loaded!" });
                                return tables.map(table => new ConnectionTreeItem(table, vscode.TreeItemCollapsibleState.None));
                            }
                            catch (error) {
                                console.error('Failed to authenticate or discover tables:', error);
                                vscode.window.showErrorMessage(`Failed to connect for table discovery: ${error}`);
                                return [];
                            }
                        });
                    }
                    return this.discoverTables(element.item.cluster, element.item.database)
                        .then(tables => {
                        return tables.map(table => new ConnectionTreeItem(table, vscode.TreeItemCollapsibleState.None));
                    })
                        .catch(error => {
                        return [];
                    });
                }
                return Promise.resolve([]);
            }
            else {
                // For tables or other types, no children
                return Promise.resolve([]);
            }
        }
    }
    async addCluster(clusterUrl, alias) {
        try {
            // Enhanced URL validation for different Kusto cluster formats
            let validatedUrl = clusterUrl.trim();
            // Add https:// if not present
            if (!validatedUrl.startsWith('https://')) {
                validatedUrl = 'https://' + validatedUrl;
            }
            // Validate that it looks like a Kusto cluster URL
            const kustoUrlPattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]*\.(kusto|kustomfa|help\.kusto)\.windows\.net$/;
            if (!kustoUrlPattern.test(validatedUrl)) {
                // Check if it might be a custom domain or internal cluster
                const customDomainPattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]+(:\d+)?$/;
                if (!customDomainPattern.test(validatedUrl)) {
                    vscode.window.showErrorMessage(`Invalid Kusto cluster URL: "${clusterUrl}"\n\n` +
                        `Expected formats:\n` +
                        `• https://clustername.kusto.windows.net\n` +
                        `• https://clustername.kustomfa.windows.net\n` +
                        `• https://help.kusto.windows.net\n` +
                        `• https://your-custom-domain.com\n\n` +
                        `Your URL: "${validatedUrl}"`);
                    return;
                }
                // For custom domains, show a warning but proceed
                const proceed = await vscode.window.showWarningMessage(`Custom cluster domain detected: ${validatedUrl}\n\nThis doesn't match standard Kusto URL patterns. Do you want to proceed?`, 'Yes, proceed', 'Cancel');
                if (proceed !== 'Yes, proceed') {
                    return;
                }
            }
            // Check if cluster already exists
            if (this.connections.find(c => c.name === validatedUrl)) {
                vscode.window.showWarningMessage('Cluster already exists in the list.');
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Adding Kusto cluster...",
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 0, message: "Loading Kusto SDK..." });
                // Try to connect and get databases
                await (0, sdkManager_1.loadKustoSDK)();
                progress.report({ increment: 25, message: "Creating connection..." });
                const KustoConnectionStringBuilder = (0, sdkManager_1.getKustoConnectionStringBuilder)();
                const KustoClient = (0, sdkManager_1.getKustoClient)();
                // Use direct browser authentication (more user-friendly than device code)
                const kcsb = KustoConnectionStringBuilder.withUserPrompt(validatedUrl);
                const client = new KustoClient(kcsb);
                // Store the authenticated client for reuse
                this.clusterClients.set(validatedUrl, client);
                progress.report({ increment: 50, message: "Connecting to cluster..." });
                if (token.isCancellationRequested) {
                    return;
                }
                // Query to get databases with timeout
                const query = '.show databases';
                progress.report({ increment: 75, message: "Discovering databases..." });
                const results = await Promise.race([
                    client.execute('', query),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000))
                ]);
                const databases = [];
                if (results && results.primaryResults && results.primaryResults.length > 0) {
                    const table = results.primaryResults[0];
                    for (const row of table.rows()) {
                        const dbName = row.DatabaseName || row[0]; // Handle different response formats
                        if (dbName) {
                            databases.push({
                                type: 'database',
                                name: dbName,
                                cluster: validatedUrl,
                                database: dbName
                            });
                        }
                    }
                }
                if (token.isCancellationRequested) {
                    return;
                }
                progress.report({ increment: 100, message: "Adding to tree..." });
                // Add cluster with databases
                const clusterItem = {
                    type: 'cluster',
                    name: alias || validatedUrl,
                    cluster: validatedUrl,
                    alias: alias,
                    children: databases
                };
                this.connections.push(clusterItem);
                this.saveConnections();
                this.refresh();
                vscode.window.showInformationMessage(`Successfully added cluster with ${databases.length} databases.`);
            });
        }
        catch (error) {
            console.error('Error adding cluster:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to add cluster: ${errorMessage}`);
        }
    }
    removeCluster(item) {
        const index = this.connections.findIndex(c => c.name === item.item.name);
        if (index !== -1) {
            // Remove the stored client
            this.clusterClients.delete(item.item.name);
            this.connections.splice(index, 1);
            this.saveConnections();
            this.refresh();
            vscode.window.showInformationMessage(`Removed cluster: ${item.item.name}`);
        }
    }
    async editClusterName(item) {
        if (item.item.type !== 'cluster') {
            return;
        }
        const currentAlias = item.item.alias || '';
        const clusterUrl = item.item.cluster || item.item.name;
        const newAlias = await vscode.window.showInputBox({
            prompt: 'Edit cluster display name',
            placeHolder: 'Enter a display name for this cluster (leave empty to use URL)',
            value: currentAlias,
            validateInput: (value) => {
                if (value && value.trim().length > 50) {
                    return 'Display name should be 50 characters or less';
                }
                return null;
            }
        });
        if (newAlias !== undefined) { // User didn't cancel
            const index = this.connections.findIndex(c => c.name === item.item.name);
            if (index !== -1) {
                const trimmedAlias = newAlias.trim();
                this.connections[index].alias = trimmedAlias || undefined;
                this.connections[index].name = trimmedAlias || clusterUrl;
                this.saveConnections();
                this.refresh();
                const displayName = trimmedAlias || clusterUrl;
                vscode.window.showInformationMessage(`Cluster name updated to: ${displayName}`);
            }
        }
    }
    async connectToDatabase(item, updateGlobalConnection) {
        if (item.item.type === 'database' && item.item.cluster && item.item.database) {
            try {
                // Try to reuse the existing authenticated client
                let client = this.clusterClients.get(item.item.cluster);
                if (!client) {
                    // Show progress while authenticating
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Authenticating to Kusto cluster...",
                        cancellable: false
                    }, async (progress) => {
                        progress.report({ increment: 0, message: "Loading Kusto SDK..." });
                        // Load SDK first
                        await (0, sdkManager_1.loadKustoSDK)();
                        progress.report({ increment: 30, message: "Creating connection..." });
                        const KustoConnectionStringBuilder = (0, sdkManager_1.getKustoConnectionStringBuilder)();
                        const KustoClient = (0, sdkManager_1.getKustoClient)();
                        // Create connection with direct browser authentication
                        const kcsb = KustoConnectionStringBuilder.withUserPrompt(item.item.cluster);
                        client = new KustoClient(kcsb);
                        progress.report({ increment: 60, message: "Testing authentication..." });
                        // Test the connection immediately to trigger authentication
                        try {
                            await client.execute(item.item.database, 'print "Authentication test"');
                            // Only store the client if authentication succeeds
                            this.clusterClients.set(item.item.cluster, client);
                            progress.report({ increment: 100, message: "Connected!" });
                        }
                        catch (authError) {
                            console.error('Authentication failed during connection test:', authError);
                            throw new Error(`Authentication failed: ${authError}`);
                        }
                    });
                }
                else {
                    // Test the existing client to make sure it's still valid
                    try {
                        await client.execute(item.item.database, 'print "Connection test"');
                    }
                    catch (testError) {
                        // Remove the failed client and try again
                        this.clusterClients.delete(item.item.cluster);
                        // Recursive call to create a new client
                        return this.connectToDatabase(item, updateGlobalConnection);
                    }
                }
                // Set the global connection for query execution
                const connection = {
                    client: client,
                    cluster: item.item.cluster,
                    database: item.item.database
                };
                updateGlobalConnection(connection);
                vscode.window.showInformationMessage(`Connected to ${item.item.database} on ${item.item.cluster}`);
                // Trigger a refresh of the tree to show tables
                this.refresh();
            }
            catch (error) {
                console.error('Error connecting to database:', error);
                vscode.window.showErrorMessage(`Failed to connect to database: ${error}`);
                // Remove the failed client
                this.clusterClients.delete(item.item.cluster);
            }
        }
    }
    async discoverTables(clusterUrl, database) {
        try {
            const client = this.clusterClients.get(clusterUrl);
            if (!client) {
                console.warn('No client found for cluster:', clusterUrl);
                return [];
            }
            // Query to get tables in the database
            const query = '.show tables';
            const results = await client.execute(database, query);
            const tables = [];
            if (results && results.primaryResults && results.primaryResults.length > 0) {
                const table = results.primaryResults[0];
                let rowCount = 0;
                for (const row of table.rows()) {
                    rowCount++;
                    const tableName = row.TableName || row[0]; // Handle different response formats
                    if (tableName) {
                        tables.push({
                            type: 'table',
                            name: tableName,
                            cluster: clusterUrl,
                            database: database,
                            table: tableName
                        });
                    }
                }
            }
            // Cache the discovered tables
            const cacheKey = `${clusterUrl}:${database}`;
            this.tableCache.set(cacheKey, tables);
            this.saveTableCache();
            return tables;
        }
        catch (error) {
            return [];
        }
    }
    copyConnectionString(item) {
        let connectionString = '';
        if (item.item.type === 'cluster') {
            // Use the actual cluster URL, not the display name
            connectionString = item.item.cluster || item.item.name;
        }
        else if (item.item.type === 'database') {
            connectionString = `${item.item.cluster}/${item.item.database}`;
        }
        else if (item.item.type === 'table') {
            connectionString = `${item.item.cluster}/${item.item.database}/${item.item.table}`;
        }
        vscode.env.clipboard.writeText(connectionString);
        vscode.window.showInformationMessage('Connection string copied to clipboard.');
    }
    loadConnections() {
        const saved = this.context.globalState.get('kustoxConnections', []);
        this.connections = saved;
    }
    saveConnections() {
        this.context.globalState.update('kustoxConnections', this.connections);
    }
    loadTableCache() {
        const saved = this.context.globalState.get('kustoxTableCache', {});
        this.tableCache = new Map(Object.entries(saved));
    }
    saveTableCache() {
        const cacheObject = Object.fromEntries(this.tableCache);
        this.context.globalState.update('kustoxTableCache', cacheObject);
    }
    refreshTableCache(clusterUrl, database) {
        const cacheKey = `${clusterUrl}:${database}`;
        this.tableCache.delete(cacheKey);
        this.refresh(); // Refresh the tree to reload tables
    }
}
exports.ConnectionTreeProvider = ConnectionTreeProvider;
//# sourceMappingURL=connectionTreeProvider.js.map