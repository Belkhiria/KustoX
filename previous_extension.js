"use strict";
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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const integrationTests_1 = require("./test/integrationTests");
const comprehensiveTests_1 = require("./test/comprehensiveTests");
// Dynamic imports for azure-kusto-data
let KustoClient;
let KustoConnectionStringBuilder;
let ClientRequestProperties;
async function loadKustoSDK() {
    if (!KustoClient) {
        console.log('Loading Azure Kusto SDK...');
        const kustoModule = await import('azure-kusto-data');
        console.log('Kusto module loaded:', kustoModule);
        console.log('Available exports:', Object.keys(kustoModule));
        KustoClient = kustoModule.Client;
        KustoConnectionStringBuilder = kustoModule.KustoConnectionStringBuilder;
        ClientRequestProperties = kustoModule.ClientRequestProperties;
        console.log('KustoClient loaded:', typeof KustoClient);
        console.log('KustoConnectionStringBuilder loaded:', typeof KustoConnectionStringBuilder);
        console.log('ClientRequestProperties loaded:', typeof ClientRequestProperties);
        if (!KustoClient || !KustoConnectionStringBuilder || !ClientRequestProperties) {
            throw new Error('Failed to load required Kusto SDK components');
        }
    }
}
// UUID for request IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
class ConnectionTreeItem extends vscode.TreeItem {
    constructor(item, collapsibleState) {
        super(item.name, collapsibleState);
        this.item = item;
        this.collapsibleState = collapsibleState;
        this.contextValue = item.type;
        if (item.type === 'cluster') {
            this.iconPath = new vscode.ThemeIcon('server-environment');
            this.tooltip = `Cluster: ${item.name}`;
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
    }
}
class ConnectionTreeProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.connections = [];
        this.clusterClients = new Map(); // Store authenticated clients
        this.loadConnections();
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
            // Return children (databases for clusters)
            const children = element.item.children || [];
            return Promise.resolve(children.map(child => new ConnectionTreeItem(child, vscode.TreeItemCollapsibleState.None)));
        }
    }
    async addCluster(clusterUrl) {
        try {
            // Validate cluster URL
            if (!clusterUrl.startsWith('https://')) {
                clusterUrl = 'https://' + clusterUrl;
            }
            // Check if cluster already exists
            if (this.connections.find(c => c.name === clusterUrl)) {
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
                await loadKustoSDK();
                progress.report({ increment: 25, message: "Creating connection..." });
                // Use interactive authentication (more user-friendly than device code)
                const kcsb = KustoConnectionStringBuilder.withUserPrompt(clusterUrl);
                const client = new KustoClient(kcsb);
                // Store the authenticated client for reuse
                this.clusterClients.set(clusterUrl, client);
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
                                cluster: clusterUrl,
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
                    name: clusterUrl,
                    cluster: clusterUrl,
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
    async connectToDatabase(item) {
        if (item.item.type === 'database' && item.item.cluster && item.item.database) {
            try {
                // Try to reuse the existing authenticated client
                let client = this.clusterClients.get(item.item.cluster);
                if (!client) {
                    // If no client exists, create a new one
                    await loadKustoSDK();
                    const kcsb = KustoConnectionStringBuilder.withUserPrompt(item.item.cluster);
                    client = new KustoClient(kcsb);
                    this.clusterClients.set(item.item.cluster, client);
                }
                kustoConnection = {
                    client: client,
                    cluster: item.item.cluster,
                    database: item.item.database
                };
                vscode.window.showInformationMessage(`Connected to ${item.item.database} on ${item.item.cluster}`);
            }
            catch (error) {
                console.error('Error connecting to database:', error);
                vscode.window.showErrorMessage(`Failed to connect to database: ${error}`);
            }
        }
    }
    copyConnectionString(item) {
        let connectionString = '';
        if (item.item.type === 'cluster') {
            connectionString = item.item.name;
        }
        else if (item.item.type === 'database') {
            connectionString = `${item.item.cluster}/${item.item.database}`;
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
}
let kustoConnection = null;
function activate(context) {
    console.log('KustoX extension is now active!');
    // Create the connection tree provider first so it can be used by other functions
    const connectionProvider = new ConnectionTreeProvider(context);
    vscode.window.registerTreeDataProvider('kustoxConnections', connectionProvider);
    // Register commands
    const openExplorer = vscode.commands.registerCommand('kustox.openExplorer', () => {
        vscode.window.showInformationMessage('KustoX Explorer activated!');
    });
    const helloWorld = vscode.commands.registerCommand('kustox.helloWorld', () => {
        vscode.window.showInformationMessage('Hello from KustoX!');
    });
    const createKustoFile = vscode.commands.registerCommand('kustox.createKustoFile', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'kusto',
            content: `// Welcome to KustoX - Modern Kusto Explorer!
// 
// ≡ƒöº First: Configure your connection using "KustoX: Configure Connection"
//    ≡ƒÆí Tip: Choose "Simple Client ID" - easiest method from official docs!
//    ≡ƒôï Default Client ID: 00001111-aaaa-2222-bbbb-3333cccc4444
// Γû╢∩╕Å  Then: Press F5 or click the Run button to execute queries
//
// ≡ƒôÜ Sample queries for the public Samples database:

// Basic query - show first 10 storm events
StormEvents
| take 10

// Filter and project specific columns
StormEvents
| where EventType == "Tornado"
| project StartTime, State, EventType, DamageProperty
| order by DamageProperty desc
| take 5

// Aggregation query - tornado damages by state
StormEvents
| where EventType == "Tornado"
| extend TotalDamage = DamageProperty + DamageCrops
| summarize TotalDamage = sum(TotalDamage) by State
| where TotalDamage > 100000000
| order by TotalDamage desc

// Time series analysis
StormEvents
| where EventType == "Tornado" 
| summarize EventCount = count() by bin(StartTime, 30d)
| order by StartTime asc

// Advanced: parametrized query example
// declare query_parameters(min_damage:long = 10000000);
// StormEvents
// | where DamageProperty > min_damage
// | summarize by EventType
// | order by EventType

print "≡ƒÜÇ KustoX is ready! Configure your connection to get started."
`
        });
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('≡ƒôä New Kusto file created! Configure connection first, then press F5 to execute queries.');
    });
    const configureConnection = vscode.commands.registerCommand('kustox.configureConnection', async () => {
        await configureKustoConnection();
    });
    const executeQuery = vscode.commands.registerCommand('kustox.executeQuery', async () => {
        await executeKustoQuery();
    });
    const disconnectKusto = vscode.commands.registerCommand('kustox.disconnect', async () => {
        kustoConnection = null;
        vscode.window.showInformationMessage('Disconnected from Kusto cluster');
    });
    async function configureKustoConnection() {
        try {
            // Ensure Kusto SDK is loaded
            await loadKustoSDK();
            // Get cluster URL
            const clusterUrl = await vscode.window.showInputBox({
                prompt: 'Enter Kusto cluster URL (e.g., https://help.kusto.windows.net)',
                placeHolder: 'https://your-cluster.kusto.windows.net',
                value: 'https://help.kusto.windows.net' // Default to help cluster for testing
            });
            if (!clusterUrl) {
                return;
            }
            // Get database name
            const database = await vscode.window.showInputBox({
                prompt: 'Enter database name',
                placeHolder: 'Samples',
                value: 'Samples' // Default to Samples database
            });
            if (!database) {
                return;
            }
            // Authentication method selection
            const authMethod = await vscode.window.showQuickPick([
                {
                    label: '≡ƒîÉ Interactive Browser (Recommended)',
                    detail: 'Simple browser authentication - no client ID needed',
                    method: 'interactive'
                },
                {
                    label: '≡ƒô▒ Device Code Authentication',
                    detail: 'Device code authentication for headless environments',
                    method: 'device-code'
                },
                {
                    label: '∩┐╜∩╕Å Azure CLI Authentication',
                    detail: 'Use existing Azure CLI login (az login required)',
                    method: 'azurecli'
                },
                {
                    label: '∩┐╜ Application Authentication',
                    detail: 'Use client ID and secret for service principal',
                    method: 'app'
                },
                {
                    label: '∩┐╜ Custom Client ID',
                    detail: 'Advanced: Use your own registered application client ID',
                    method: 'custom-client-id'
                }
            ], {
                placeHolder: 'Select authentication method'
            });
            if (!authMethod) {
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Connecting to Kusto cluster...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                let kcsb;
                switch (authMethod.method) {
                    case 'interactive':
                        // Simple interactive browser authentication - no client ID required
                        // This should work for public clusters like help.kusto.windows.net
                        kcsb = KustoConnectionStringBuilder.withUserPrompt(clusterUrl);
                        break;
                    case 'custom-client-id':
                        // Custom client ID authentication for user-registered applications
                        const customClientId = await vscode.window.showInputBox({
                            prompt: 'Enter your registered Application (Client) ID',
                            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                            validateInput: (value) => {
                                if (!value || value.trim() === '') {
                                    return 'Client ID cannot be empty';
                                }
                                // Basic GUID format validation
                                const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                if (!guidRegex.test(value.trim())) {
                                    return 'Please enter a valid GUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)';
                                }
                                return null;
                            }
                        });
                        if (!customClientId) {
                            vscode.window.showErrorMessage('Client ID is required for custom client ID authentication');
                            return;
                        }
                        const redirectUri = await vscode.window.showInputBox({
                            prompt: 'Enter redirect URI (or press Enter for default)',
                            placeHolder: 'http://localhost:3000',
                            value: 'http://localhost:3000'
                        });
                        // Custom client ID with auth options
                        const authOptions = {
                            clientId: customClientId.trim(),
                            redirectUri: redirectUri || 'http://localhost:3000'
                        };
                        kcsb = KustoConnectionStringBuilder.withUserPrompt(clusterUrl, authOptions);
                        break;
                    case 'device-code':
                        // Device code authentication
                        kcsb = KustoConnectionStringBuilder.withDeviceCodeAuthentication(clusterUrl, (message, url, code) => {
                            vscode.window.showInformationMessage(`Device Code Authentication Required:\n\nCode: ${code}\n\nPlease visit: ${url}\n\nMessage: ${message}`, 'Open Browser').then(selection => {
                                if (selection === 'Open Browser') {
                                    vscode.env.openExternal(vscode.Uri.parse(url));
                                }
                            });
                            return Promise.resolve();
                        });
                        break;
                    case 'azurecli':
                        // Azure CLI authentication
                        kcsb = KustoConnectionStringBuilder.withAzCliAuthentication(clusterUrl);
                        break;
                    case 'app':
                        // Application authentication
                        const appClientId = await vscode.window.showInputBox({
                            prompt: 'Enter Application (Client) ID',
                            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                        });
                        const clientSecret = await vscode.window.showInputBox({
                            prompt: 'Enter Client Secret',
                            password: true
                        });
                        const tenantId = await vscode.window.showInputBox({
                            prompt: 'Enter Tenant ID (Authority ID)',
                            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                        });
                        if (!appClientId || !clientSecret || !tenantId) {
                            vscode.window.showErrorMessage('All application authentication fields are required');
                            return;
                        }
                        kcsb = KustoConnectionStringBuilder.withApplicationKeyAuthentication(clusterUrl, appClientId, clientSecret, tenantId);
                        break;
                    default:
                        throw new Error('Invalid authentication method');
                }
                progress.report({ increment: 50, message: "Creating client..." });
                const client = new KustoClient(kcsb);
                progress.report({ increment: 80, message: "Testing connection..." });
                // Test the connection with a simple query
                console.log('Testing connection with simple query...');
                const testResponse = await client.execute(database, 'print "Connection test successful"');
                console.log('Test query response:', testResponse);
                console.log('Test query response type:', typeof testResponse);
                console.log('Test query response keys:', Object.keys(testResponse || {}));
                progress.report({ increment: 100, message: "Connected!" });
                kustoConnection = {
                    client,
                    cluster: clusterUrl,
                    database
                };
                // Also add the cluster to the connection tree for future use
                try {
                    await connectionProvider.addCluster(clusterUrl);
                }
                catch (treeError) {
                    // If adding to tree fails, don't fail the whole connection
                    console.warn('Failed to add cluster to tree view:', treeError);
                }
                vscode.window.showInformationMessage(`Γ£à Successfully connected to ${clusterUrl}/${database}`);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Γ¥î Failed to connect to Kusto: ${errorMessage}`);
            console.error('Kusto connection error:', error);
        }
    }
    async function executeKustoQuery() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a Kusto (.kql) file.');
            return;
        }
        if (editor.document.languageId !== 'kusto') {
            vscode.window.showErrorMessage('Please open a Kusto (.kql) file to execute queries.');
            return;
        }
        if (!kustoConnection) {
            const configure = await vscode.window.showErrorMessage('No Kusto connection configured. Would you like to configure one now?', 'Configure Connection');
            if (configure) {
                await configureKustoConnection();
                if (!kustoConnection) {
                    return;
                }
            }
            else {
                return;
            }
        }
        // Validate connection details
        console.log('Kusto connection details:', {
            cluster: kustoConnection.cluster,
            database: kustoConnection.database,
            hasClient: !!kustoConnection.client
        });
        // Get the query text (selected text or entire document)
        const query = editor.selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(editor.selection);
        if (!query.trim()) {
            vscode.window.showErrorMessage('No query found. Please write a Kusto query first.');
            return;
        }
        // Clean the query (remove only comment lines and empty lines, preserve all other content)
        const lines = query.split('\n');
        const cleanLines = lines
            .map(line => line.trimRight()) // Remove trailing whitespace but preserve leading whitespace for formatting
            .filter(line => {
            const trimmedLine = line.trim();
            // Keep the line if it's not empty and doesn't start with //
            return trimmedLine.length > 0 && !trimmedLine.startsWith('//');
        });
        const cleanQuery = cleanLines.join('\n').trim();
        if (!cleanQuery.trim()) {
            vscode.window.showErrorMessage('No executable query found. Please write a Kusto query (non-comment lines).');
            return;
        }
        console.log('Executing query:', cleanQuery);
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Executing Kusto Query...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                const startTime = Date.now();
                // Create client request properties following official documentation
                const crp = new ClientRequestProperties();
                // Set a custom client request identifier
                crp.clientRequestId = `KustoX-${generateUUID()}`;
                // Set the query timeout to 5 minutes
                crp.setTimeout(5 * 60 * 1000);
                // Add application context
                crp.setOption('application', 'KustoX-VSCode-Extension');
                crp.setOption('version', '0.1.0');
                progress.report({ increment: 30, message: "Sending query to cluster..." });
                // First, test the connection with a simple query if this is the first query
                if (cleanQuery.includes('print') || cleanQuery.includes('StormEvents') || cleanQuery.includes('.show')) {
                    console.log('Executing user query directly...');
                }
                else {
                    console.log('Testing connection first...');
                    try {
                        const testResponse = await kustoConnection.client.execute(kustoConnection.database, 'print "Connection test"');
                        console.log('Connection test successful:', !!testResponse);
                    }
                    catch (testError) {
                        console.error('Connection test failed:', testError);
                        throw new Error('Connection test failed. Please reconnect to the database.');
                    }
                }
                // Execute query with client request properties
                const response = await kustoConnection.client.execute(kustoConnection.database, cleanQuery, crp);
                const executionTime = Date.now() - startTime;
                progress.report({ increment: 80, message: "Processing results..." });
                // Process the response using official patterns
                const results = processKustoResponse(response, executionTime);
                progress.report({ increment: 100, message: "Complete!" });
                // Show results in a new panel
                showQueryResults(query, results, kustoConnection);
            });
        }
        catch (error) {
            // Enhanced error handling for detailed Kusto errors
            let detailedError = parseKustoError(error);
            vscode.window.showErrorMessage(`Γ¥î Query execution failed: ${detailedError.summary}`);
            console.error('Query execution error:', error);
            console.error('Parsed error details:', detailedError);
            // Show detailed error in results panel
            showQueryError(query, detailedError, kustoConnection);
        }
    }
    // Enhanced error parsing for Kusto-specific errors
    function parseKustoError(error) {
        let summary = 'Unknown error occurred';
        let details = '';
        let code = '';
        let severity = 'Error';
        let category = 'General';
        let oneApiErrors = [];
        try {
            // Check if error has response data (common in HTTP errors)
            if (error?.response?.data) {
                const responseData = error.response.data;
                // Check for OneAPI error format (Kusto specific)
                if (responseData.error && responseData.error.innererror && responseData.error.innererror.message) {
                    summary = responseData.error.innererror.message;
                    details = responseData.error.message || summary;
                    code = responseData.error.code || responseData.error['@type'] || '';
                }
                // Standard error format
                else if (responseData.error && responseData.error.message) {
                    summary = responseData.error.message;
                    details = responseData.error.message;
                    code = responseData.error.code || '';
                }
                // Check for OneAPI errors array
                else if (responseData.error && responseData.error['@odata.errors']) {
                    const odataErrors = responseData.error['@odata.errors'];
                    if (Array.isArray(odataErrors) && odataErrors.length > 0) {
                        const firstError = odataErrors[0];
                        summary = firstError.message || 'Query parsing error';
                        details = firstError.message || summary;
                        code = firstError.code || '';
                        oneApiErrors = odataErrors;
                    }
                }
                // Try to parse JSON string in error message
                else if (typeof responseData === 'string') {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (parsed.error && parsed.error.message) {
                            summary = parsed.error.message;
                            details = parsed.error.message;
                            code = parsed.error.code || '';
                        }
                    }
                    catch {
                        summary = responseData;
                        details = responseData;
                    }
                }
            }
            // Check if error message contains structured information
            else if (error?.message) {
                const message = error.message;
                // Try to extract JSON from error message
                const jsonMatch = message.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const errorJson = JSON.parse(jsonMatch[0]);
                        if (errorJson.error && errorJson.error.innererror && errorJson.error.innererror.message) {
                            summary = errorJson.error.innererror.message;
                            details = errorJson.error.message || summary;
                            code = errorJson.error.code || '';
                        }
                        else if (errorJson.error && errorJson.error.message) {
                            summary = errorJson.error.message;
                            details = errorJson.error.message;
                            code = errorJson.error.code || '';
                        }
                    }
                    catch {
                        // JSON parsing failed, use message as is
                        summary = message;
                        details = message;
                    }
                }
                else {
                    // Look for common Kusto error patterns
                    if (message.includes('Failed to resolve')) {
                        summary = message;
                        category = 'Semantic Error';
                        severity = 'Error';
                    }
                    else if (message.includes('Syntax error')) {
                        summary = message;
                        category = 'Syntax Error';
                        severity = 'Error';
                    }
                    else if (message.includes('operator:')) {
                        summary = message;
                        category = 'Operator Error';
                        severity = 'Error';
                    }
                    else {
                        summary = message;
                    }
                    details = message;
                }
            }
            // Handle status code errors
            else if (error?.status || error?.statusCode) {
                const status = error.status || error.statusCode;
                switch (status) {
                    case 400:
                        summary = 'Bad Request - Query syntax or semantic error';
                        category = 'Query Error';
                        break;
                    case 401:
                        summary = 'Unauthorized - Authentication failed';
                        category = 'Authentication Error';
                        break;
                    case 403:
                        summary = 'Forbidden - Insufficient permissions';
                        category = 'Authorization Error';
                        break;
                    case 429:
                        summary = 'Too Many Requests - Rate limit exceeded';
                        category = 'Rate Limit Error';
                        break;
                    case 500:
                        summary = 'Internal Server Error - Cluster issue';
                        category = 'Server Error';
                        break;
                    default:
                        summary = `HTTP ${status} error occurred`;
                        category = 'HTTP Error';
                }
                details = `HTTP Status: ${status}`;
                code = status.toString();
            }
        }
        catch (parseError) {
            // Fallback error handling
            summary = error instanceof Error ? error.message : 'Unknown error occurred';
            details = error instanceof Error ? error.stack || error.message : String(error);
        }
        return {
            summary,
            details,
            code,
            severity,
            category,
            oneApiErrors,
            rawError: error
        };
    }
    function processKustoResponse(response, executionTimeMs) {
        try {
            // The Azure Kusto SDK returns a KustoResponseDataSetV2 object
            if (!response || !response.primaryResults || response.primaryResults.length === 0) {
                return {
                    columns: ['Result'],
                    rows: [['Query executed successfully but returned no data']],
                    executionTime: `${executionTimeMs}ms`,
                    rowCount: 0,
                    hasData: false
                };
            }
            // Get the first primary result table
            const primaryTable = response.primaryResults[0];
            // Extract column names
            const columns = primaryTable.columns.map((col) => col.columnName || col.name || 'Column');
            // Extract rows from the _rows property (this is the actual data)
            const rows = [];
            if (primaryTable._rows && Array.isArray(primaryTable._rows)) {
                primaryTable._rows.forEach((row) => {
                    const formattedRow = row.map(cell => formatCellValue(cell));
                    rows.push(formattedRow);
                });
            }
            else {
                // Try the rows() iterator method as fallback
                try {
                    for (const kustoRow of primaryTable.rows()) {
                        // KustoResultRow has a 'raw' property with the actual data
                        const rowData = kustoRow.raw || Object.values(kustoRow).filter(val => val !== kustoRow.columns && Array.isArray(val))[0] || [];
                        const formattedRow = rowData.map((cell) => formatCellValue(cell));
                        rows.push(formattedRow);
                    }
                }
                catch (iteratorError) {
                    // Silently handle iterator errors
                }
            }
            const executionTime = executionTimeMs < 1000
                ? `${executionTimeMs}ms`
                : `${(executionTimeMs / 1000).toFixed(2)}s`;
            return {
                columns,
                rows,
                executionTime,
                rowCount: rows.length,
                hasData: rows.length > 0,
                totalRows: rows.length
            };
        }
        catch (error) {
            return {
                columns: ['Error'],
                rows: [['Failed to process query results: ' + (error instanceof Error ? error.message : 'Unknown error')]],
                executionTime: `${executionTimeMs}ms`,
                rowCount: 0,
                hasData: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    function formatCellValue(cellValue) {
        if (cellValue === null || cellValue === undefined) {
            return 'null';
        }
        if (typeof cellValue === 'object') {
            if (cellValue instanceof Date) {
                return cellValue.toISOString();
            }
            return JSON.stringify(cellValue);
        }
        if (typeof cellValue === 'boolean') {
            return cellValue.toString();
        }
        if (typeof cellValue === 'number') {
            return cellValue.toString();
        }
        return String(cellValue);
    }
    function showQueryResults(query, results, connection) {
        // Create and show a new webview panel for results
        const panel = vscode.window.createWebviewPanel('kustoResults', 'Kusto Query Results', vscode.ViewColumn.Two, {
            enableScripts: true
        });
        panel.webview.html = getResultsWebviewContent(query, results, connection);
    }
    function showQueryError(query, errorDetails, connection) {
        const panel = vscode.window.createWebviewPanel('kustoError', 'Kusto Query Error', vscode.ViewColumn.Two, {
            enableScripts: true
        });
        panel.webview.html = getErrorWebviewContent(query, errorDetails, connection);
    }
    function getResultsWebviewContent(query, results, connection) {
        // Detect if query contains render command for visualization
        const renderMatch = query.match(/\|\s*render\s+(\w+)/i);
        const chartType = renderMatch ? renderMatch[1].toLowerCase() : null;
        const hasVisualization = chartType && ['columnchart', 'barchart', 'piechart', 'timechart', 'linechart', 'areachart', 'scatterchart'].includes(chartType);
        const tableRows = results.rows.map((row) => `<tr>${row.map((cell) => `<td title="${cell}">${cell}</td>`).join('')}</tr>`).join('');
        const statusClass = results.hasData ? 'success' : 'warning';
        const statusIcon = results.hasData ? 'Γ£ô' : 'ΓÜá∩╕Å';
        const statusText = results.hasData ? 'Query executed successfully' : 'Query executed with no data';
        // Generate chart HTML if visualization is requested
        const chartHtml = hasVisualization ? generateChartHtml(results, chartType) : '';
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kusto Query Results</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 20px;
                }
                .connection-info {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    font-size: 12px;
                }
                .query-info {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    border-left: 3px solid var(--vscode-charts-blue);
                }
                .stats {
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .results-tabs {
                    display: flex;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .tab-button {
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    font-family: var(--vscode-font-family);
                }
                .tab-button.active {
                    border-bottom-color: var(--vscode-charts-blue);
                    color: var(--vscode-charts-blue);
                    font-weight: bold;
                }
                .tab-button:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .tab-content {
                    display: none;
                }
                .tab-content.active {
                    display: block;
                }
                .chart-container {
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    position: relative;
                    height: 400px;
                }
                .chart-title {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 18px;
                    font-weight: bold;
                    color: var(--vscode-charts-blue);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: var(--vscode-editor-background);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                th, td {
                    text-align: left;
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                th {
                    background-color: var(--vscode-panel-background);
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .success {
                    color: var(--vscode-charts-green);
                }
                .warning {
                    color: var(--vscode-charts-orange);
                }
                .query-text {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                    white-space: pre-wrap;
                    line-height: 1.4;
                }
                .table-container {
                    max-height: 60vh;
                    overflow: auto;
                    border: 1px solid var(--vscode-panel-border);
                }
            </style>
        </head>
        <body>
            <h2>≡ƒöì Kusto Query Results</h2>
            <div class="connection-info">
                ≡ƒöù Connected to: <strong>${connection.cluster}</strong> / <strong>${connection.database}</strong>
            </div>
            <div class="query-info">
                <strong>≡ƒô¥ Executed Query:</strong><br>
                <div class="query-text">${query}</div>
            </div>
            <div class="stats">
                <div class="stat-item">
                    <span class="${statusClass}">${statusIcon}</span>
                    <span>${statusText}</span>
                </div>
                <div class="stat-item">
                    <span>ΓÅ▒∩╕Å</span>
                    <span><strong>Time:</strong> ${results.executionTime}</span>
                </div>
                <div class="stat-item">
                    <span>≡ƒôè</span>
                    <span><strong>Rows:</strong> ${results.rowCount}${results.totalRows && results.totalRows !== results.rowCount ? ` of ${results.totalRows}` : ''}</span>
                </div>
                <div class="stat-item">
                    <span>≡ƒôï</span>
                    <span><strong>Columns:</strong> ${results.columns.length}</span>
                </div>
                ${hasVisualization ? `<div class="stat-item"><span>≡ƒôê</span><span><strong>Chart:</strong> ${chartType}</span></div>` : ''}
            </div>

            ${hasVisualization ? `
            <div class="results-tabs">
                <button class="tab-button active" onclick="showTab('chart')">≡ƒôê Chart</button>
                <button class="tab-button" onclick="showTab('table')">≡ƒôï Table</button>
            </div>

            <div id="chart-tab" class="tab-content active">
                ${chartHtml}
            </div>

            <div id="table-tab" class="tab-content">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>${results.columns.map((col) => `<th>${col}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>${results.columns.map((col) => `<th>${col}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            `}

            <script>
                function showTab(tabName) {
                    // Hide all tab contents
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Remove active class from all buttons
                    document.querySelectorAll('.tab-button').forEach(button => {
                        button.classList.remove('active');
                    });
                    
                    // Show selected tab content
                    document.getElementById(tabName + '-tab').classList.add('active');
                    
                    // Add active class to clicked button
                    event.target.classList.add('active');
                }
            </script>
        </body>
        </html>`;
    }
    // Generate chart HTML for different visualization types
    function generateChartHtml(results, chartType) {
        const chartId = `chart-${Date.now()}`;
        // Prepare data for Chart.js
        const chartData = prepareChartData(results, chartType);
        return `
            <div class="chart-container">
                <div class="chart-title">${getChartTitle(chartType)} - ${results.rowCount} Data Points</div>
                <canvas id="${chartId}" width="400" height="300"></canvas>
            </div>
            <script>
                (function() {
                    const ctx = document.getElementById('${chartId}').getContext('2d');
                    
                    // VS Code theme-aware colors
                    const isDark = document.body.style.backgroundColor !== 'rgb(255, 255, 255)';
                    const colors = {
                        primary: isDark ? '#007ACC' : '#0066CC',
                        secondary: isDark ? '#4FC1FF' : '#0078D4',
                        success: isDark ? '#89D185' : '#107C10',
                        warning: isDark ? '#FFD23F' : '#FF8C00',
                        error: isDark ? '#F85149' : '#D13438',
                        text: isDark ? '#CCCCCC' : '#333333',
                        gridLines: isDark ? '#444444' : '#E1E1E1'
                    };

                    const colorPalette = [
                        colors.primary, colors.secondary, colors.success, 
                        colors.warning, colors.error, '#9A73E8', '#FF6B9D', 
                        '#4ADE80', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
                    ];

                    ${generateChartScript(chartData, chartType)}
                })();
            </script>
        `;
    }
    // Prepare data for different chart types
    function prepareChartData(results, chartType) {
        if (!results.rows || results.rows.length === 0) {
            return { labels: [], datasets: [] };
        }
        const columns = results.columns;
        const rows = results.rows;
        // For most charts, assume first column is labels, subsequent columns are data
        const labels = rows.map((row) => String(row[0] || ''));
        switch (chartType) {
            case 'piechart':
                // For pie chart, use first column as labels, second as values
                const pieData = rows.map((row) => ({
                    label: String(row[0] || ''),
                    value: Number(row[1]) || 0
                }));
                return {
                    labels: pieData.map((d) => d.label),
                    data: pieData.map((d) => d.value)
                };
            case 'timechart':
            case 'linechart':
            case 'areachart':
                // For time series, first column should be datetime
                const timeData = rows.map((row) => ({
                    x: row[0],
                    y: Number(row[1]) || 0
                }));
                return {
                    labels: labels,
                    datasets: [{
                            label: columns[1] || 'Value',
                            data: timeData.map((d) => d.y),
                            borderColor: '#007ACC',
                            backgroundColor: chartType === 'areachart' ? 'rgba(0, 122, 204, 0.1)' : undefined,
                            fill: chartType === 'areachart'
                        }]
                };
            case 'scatterchart':
                // For scatter, assume x and y coordinates in first two columns
                const scatterData = rows.map((row) => ({
                    x: Number(row[0]) || 0,
                    y: Number(row[1]) || 0
                }));
                return {
                    datasets: [{
                            label: 'Data Points',
                            data: scatterData,
                            backgroundColor: '#007ACC',
                            borderColor: '#007ACC'
                        }]
                };
            case 'columnchart':
            case 'barchart':
            default:
                // For bar/column charts, create datasets for each numeric column after the first
                const datasets = [];
                for (let i = 1; i < columns.length; i++) {
                    const data = rows.map((row) => Number(row[i]) || 0);
                    datasets.push({
                        label: columns[i],
                        data: data,
                        backgroundColor: `rgba(0, 122, 204, 0.8)`,
                        borderColor: '#007ACC',
                        borderWidth: 1
                    });
                }
                return {
                    labels: labels,
                    datasets: datasets.length > 0 ? datasets : [{
                            label: 'Values',
                            data: rows.map((row) => Number(row[1]) || 0),
                            backgroundColor: 'rgba(0, 122, 204, 0.8)',
                            borderColor: '#007ACC',
                            borderWidth: 1
                        }]
                };
        }
    }
    // Generate Chart.js configuration script
    function generateChartScript(chartData, chartType) {
        const isHorizontal = chartType === 'barchart';
        switch (chartType) {
            case 'piechart':
                return `
                    new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: ${JSON.stringify(chartData.labels)},
                            datasets: [{
                                data: ${JSON.stringify(chartData.data)},
                                backgroundColor: colorPalette.slice(0, ${chartData.labels.length}),
                                borderWidth: 2,
                                borderColor: colors.text
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: { color: colors.text }
                                }
                            }
                        }
                    });
                `;
            case 'scatterchart':
                return `
                    new Chart(ctx, {
                        type: 'scatter',
                        data: ${JSON.stringify(chartData)},
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    type: 'linear',
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                },
                                y: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: colors.text } }
                            }
                        }
                    });
                `;
            case 'timechart':
            case 'linechart':
            case 'areachart':
                return `
                    new Chart(ctx, {
                        type: 'line',
                        data: ${JSON.stringify(chartData)},
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                },
                                y: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: colors.text } }
                            }
                        }
                    });
                `;
            case 'barchart':
                return `
                    new Chart(ctx, {
                        type: 'bar',
                        data: ${JSON.stringify(chartData)},
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            scales: {
                                x: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                },
                                y: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: colors.text } }
                            }
                        }
                    });
                `;
            case 'columnchart':
            default:
                return `
                    new Chart(ctx, {
                        type: 'bar',
                        data: ${JSON.stringify(chartData)},
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                },
                                y: {
                                    grid: { color: colors.gridLines },
                                    ticks: { color: colors.text }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: colors.text } }
                            }
                        }
                    });
                `;
        }
    }
    // Get user-friendly chart titles
    function getChartTitle(chartType) {
        const titles = {
            'columnchart': 'Column Chart',
            'barchart': 'Bar Chart',
            'piechart': 'Pie Chart',
            'timechart': 'Time Series Chart',
            'linechart': 'Line Chart',
            'areachart': 'Area Chart',
            'scatterchart': 'Scatter Plot'
        };
        return titles[chartType] || 'Chart';
    }
    function getErrorWebviewContent(query, errorDetails, connection) {
        // Handle both old string format and new detailed format for backward compatibility
        const details = typeof errorDetails === 'string'
            ? { summary: errorDetails, details: errorDetails, category: 'Error', severity: 'Error' }
            : errorDetails;
        const additionalErrorInfo = details.oneApiErrors && details.oneApiErrors.length > 0
            ? details.oneApiErrors.map((error, index) => `
                <div style="margin-top: 10px; padding: 10px; background: var(--vscode-textCodeBlock-background); border-radius: 4px;">
                    <strong>Error ${index + 1}:</strong><br>
                    <div style="margin-top: 5px; font-family: monospace; font-size: 12px;">${error.message || 'Unknown error'}</div>
                    ${error.code ? `<div style="margin-top: 5px; color: var(--vscode-descriptionForeground); font-size: 11px;">Code: ${error.code}</div>` : ''}
                </div>
            `).join('')
            : '';
        const errorCodeInfo = details.code
            ? `<div style="margin-top: 10px; color: var(--vscode-descriptionForeground); font-size: 12px;">
                <strong>Error Code:</strong> ${details.code}
               </div>`
            : '';
        const errorCategoryInfo = details.category && details.category !== 'General'
            ? `<div style="margin-top: 5px; color: var(--vscode-descriptionForeground); font-size: 12px;">
                <strong>Category:</strong> ${details.category}
               </div>`
            : '';
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kusto Query Error</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 20px;
                    line-height: 1.6;
                }
                .connection-info {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    font-size: 12px;
                }
                .query-info {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    border-left: 3px solid var(--vscode-charts-blue);
                }
                .error-info {
                    background-color: var(--vscode-inputValidation-errorBackground);
                    color: var(--vscode-inputValidation-errorForeground);
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    border-left: 3px solid var(--vscode-charts-red);
                }
                .error-summary {
                    font-size: 16px;
                    font-weight: bold;
                    color: var(--vscode-charts-red);
                    margin-bottom: 10px;
                }
                .error-details {
                    background-color: rgba(255, 0, 0, 0.1);
                    padding: 10px;
                    border-radius: 4px;
                    margin-top: 10px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                    border: 1px solid rgba(255, 0, 0, 0.3);
                }
                .query-text {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                    white-space: pre-wrap;
                    line-height: 1.4;
                    background-color: var(--vscode-editor-background);
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid var(--vscode-widget-border);
                    margin-top: 8px;
                }
                .help-section {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 4px;
                    margin-top: 20px;
                    border-left: 3px solid var(--vscode-charts-orange);
                }
                .help-title {
                    color: var(--vscode-charts-orange);
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .severity-${details.severity?.toLowerCase() || 'error'} {
                    color: ${details.severity === 'Warning' ? 'var(--vscode-charts-orange)' : 'var(--vscode-charts-red)'};
                }
            </style>
        </head>
        <body>
            <h2>Γ¥î Kusto Query Error</h2>
            
            <div class="connection-info">
                ≡ƒöù Connected to: <strong>${connection.cluster}</strong> / <strong>${connection.database}</strong>
            </div>
            
            <div class="query-info">
                <strong>≡ƒô¥ Failed Query:</strong>
                <div class="query-text">${query}</div>
            </div>
            
            <div class="error-info">
                <div class="error-summary severity-${details.severity?.toLowerCase() || 'error'}">
                    ${details.summary}
                </div>
                ${errorCategoryInfo}
                ${errorCodeInfo}
                
                <div class="error-details">
                    <strong>Details:</strong><br>
                    ${details.details}
                </div>
                
                ${additionalErrorInfo}
            </div>

            <div class="help-section">
                <div class="help-title">≡ƒÆí Troubleshooting Tips</div>
                <ul>
                    <li><strong>Column/Property Errors:</strong> Check if all referenced columns exist in the source table(s)</li>
                    <li><strong>Syntax Errors:</strong> Verify KQL syntax, operators, and function calls</li>
                    <li><strong>Table Errors:</strong> Ensure table names are correct and accessible</li>
                    <li><strong>Function Errors:</strong> Check function parameters and data types</li>
                    <li><strong>Authentication Errors:</strong> Verify your connection and permissions</li>
                </ul>
                <p style="margin-top: 15px; font-size: 12px; color: var(--vscode-descriptionForeground);">
                    ≡ƒÆí <strong>Tip:</strong> Use Ctrl+Space for IntelliSense suggestions and check the 
                    <a href="https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/" style="color: var(--vscode-textLink-foreground);">
                    KQL documentation
                    </a> for syntax reference.
                </p>
            </div>
        </body>
        </html>`;
    }
    // Register tree view commands
    const addClusterCommand = vscode.commands.registerCommand('kustox.addCluster', async () => {
        const clusterUrl = await vscode.window.showInputBox({
            prompt: 'Enter Kusto cluster URL',
            placeHolder: 'https://your-cluster.kusto.windows.net',
            validateInput: (value) => {
                if (!value) {
                    return 'Cluster URL is required';
                }
                if (!value.includes('.kusto.windows.net') && !value.includes('localhost') && !value.includes('127.0.0.1')) {
                    return 'Please enter a valid Kusto cluster URL';
                }
                return null;
            }
        });
        if (clusterUrl) {
            await connectionProvider.addCluster(clusterUrl);
        }
    });
    const refreshConnectionsCommand = vscode.commands.registerCommand('kustox.refreshConnections', () => {
        connectionProvider.refresh();
        vscode.window.showInformationMessage('Connection tree refreshed.');
    });
    const connectToDatabaseCommand = vscode.commands.registerCommand('kustox.connectToDatabase', (item) => {
        connectionProvider.connectToDatabase(item);
    });
    const removeClusterCommand = vscode.commands.registerCommand('kustox.removeCluster', async (item) => {
        const answer = await vscode.window.showWarningMessage(`Are you sure you want to remove cluster "${item.item.name}"?`, 'Yes', 'No');
        if (answer === 'Yes') {
            connectionProvider.removeCluster(item);
        }
    });
    const copyConnectionStringCommand = vscode.commands.registerCommand('kustox.copyConnectionString', (item) => {
        connectionProvider.copyConnectionString(item);
    });
    context.subscriptions.push(openExplorer, helloWorld, createKustoFile, configureConnection, executeQuery, disconnectKusto, addClusterCommand, refreshConnectionsCommand, connectToDatabaseCommand, removeClusterCommand, copyConnectionStringCommand);
    // Register integration tests
    (0, integrationTests_1.registerIntegrationTests)(context);
    // Register comprehensive tests
    (0, comprehensiveTests_1.registerComprehensiveTests)(context);
    // Show a welcome message when the extension activates
    vscode.window.showInformationMessage('KustoX extension loaded! Use "KustoX: Configure Connection" to connect to your cluster.');
}
exports.activate = activate;
function deactivate() {
    kustoConnection = null;
    console.log('KustoX extension is now deactivated!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=previous_extension.js.map