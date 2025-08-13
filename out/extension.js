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
exports.resultsFileSystem = exports.updateConnectionStatus = exports.kustoConnection = exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const connectionTreeProvider_1 = require("./connection/connectionTreeProvider");
const connectionConfigurator_1 = require("./connection/connectionConfigurator");
const queryExecutor_1 = require("./query/queryExecutor");
const mockDataGenerator_1 = require("./mockData/mockDataGenerator");
const queryResultsFileSystem_1 = require("./vfs/queryResultsFileSystem");
const vfsTreeProvider_1 = require("./vfs/vfsTreeProvider");
// Global connection state
let kustoConnection = null;
exports.kustoConnection = kustoConnection;
let connectionStatusBarItem;
let vfsToggleStatusBarItem;
let resultsFileSystem;
exports.resultsFileSystem = resultsFileSystem;
function updateConnectionStatus() {
    if (kustoConnection) {
        connectionStatusBarItem.text = `$(database) ${kustoConnection.cluster.split('//')[1]} / ${kustoConnection.database}`;
        connectionStatusBarItem.tooltip = `Connected to ${kustoConnection.cluster} database ${kustoConnection.database}`;
        connectionStatusBarItem.backgroundColor = undefined;
    }
    else {
        connectionStatusBarItem.text = `$(database) Not Connected`;
        connectionStatusBarItem.tooltip = 'Click to configure Kusto connection';
        connectionStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    connectionStatusBarItem.show();
}
exports.updateConnectionStatus = updateConnectionStatus;
function updateVFSToggleStatus() {
    const config = vscode.workspace.getConfiguration('kustox.ai');
    const autoOpenVFS = config.get('autoOpenVFS', false);
    if (autoOpenVFS) {
        vfsToggleStatusBarItem.text = `$(eye) VFS Auto-Open ON`;
        vfsToggleStatusBarItem.tooltip = 'VFS Auto-Open is ON - Query results will open automatically alongside .kql files for GitHub Copilot. Click to toggle.';
        vfsToggleStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    }
    else {
        vfsToggleStatusBarItem.text = `$(eye-closed) VFS Auto-Open OFF`;
        vfsToggleStatusBarItem.tooltip = 'VFS Auto-Open is OFF - Query results are only in tree view. Click to toggle.';
        vfsToggleStatusBarItem.backgroundColor = undefined;
    }
    vfsToggleStatusBarItem.show();
}
function activate(context) {
    // Initialize Virtual File System for AI access (single file mode)
    exports.resultsFileSystem = resultsFileSystem = queryResultsFileSystem_1.QueryResultsFileSystemProvider.register(context);
    // Create status bar item
    connectionStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    connectionStatusBarItem.command = 'kustox.configureConnection';
    updateConnectionStatus();
    context.subscriptions.push(connectionStatusBarItem);
    // Create VFS toggle status bar item
    vfsToggleStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    vfsToggleStatusBarItem.command = 'kustox.toggleVFSAutoOpen';
    updateVFSToggleStatus();
    context.subscriptions.push(vfsToggleStatusBarItem);
    // Create the connection tree provider
    const connectionProvider = new connectionTreeProvider_1.ConnectionTreeProvider(context);
    vscode.window.registerTreeDataProvider('kustoxConnections', connectionProvider);
    // Create VFS tree provider
    const vfsTreeProvider = new vfsTreeProvider_1.VFSTreeProvider(resultsFileSystem);
    vscode.window.registerTreeDataProvider('kustoxVFS', vfsTreeProvider);
    // Create utility instances
    const connectionConfigurator = new connectionConfigurator_1.ConnectionConfigurator((connection) => {
        exports.kustoConnection = kustoConnection = connection;
        updateConnectionStatus();
        connectionProvider.refresh();
    }, updateConnectionStatus);
    const queryExecutor = new queryExecutor_1.QueryExecutor(() => kustoConnection, resultsFileSystem);
    // Register commands
    const openExplorer = vscode.commands.registerCommand('kustox.openExplorer', () => {
        vscode.commands.executeCommand('kustoxConnections.focus');
    });
    const helloWorld = vscode.commands.registerCommand('kustox.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from KustoX!');
    });
    const createKustoFile = vscode.commands.registerCommand('kustox.createKustoFile', async () => {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('query.kql'),
            filters: {
                'Kusto Query Files': ['kql']
            }
        });
        if (uri) {
            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.createFile(uri, { ignoreIfExists: true });
            await vscode.workspace.applyEdit(workspaceEdit);
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
        }
    });
    const configureConnectionCommand = vscode.commands.registerCommand('kustox.configureConnection', async () => {
        await connectionConfigurator.configureConnection();
    });
    const executeQueryCommand = vscode.commands.registerCommand('kustox.executeQuery', async () => {
        await queryExecutor.executeQuery();
    });
    const disconnectKusto = vscode.commands.registerCommand('kustox.disconnect', async () => {
        exports.kustoConnection = kustoConnection = null;
        updateConnectionStatus();
        connectionProvider.refresh();
        vscode.window.showInformationMessage('Disconnected from Kusto cluster.');
    });
    const showConnectionStatus = vscode.commands.registerCommand('kustox.showConnectionStatus', async () => {
        if (kustoConnection) {
            const info = `Connected to:\nCluster: ${kustoConnection.cluster}\nDatabase: ${kustoConnection.database}`;
            vscode.window.showInformationMessage(info);
        }
        else {
            vscode.window.showWarningMessage('Not connected to any Kusto cluster. Use "KustoX: Configure Connection" to connect.');
        }
    });
    // Register tree view commands
    const addClusterCommand = vscode.commands.registerCommand('kustox.addCluster', async () => {
        const clusterUrl = await vscode.window.showInputBox({
            prompt: 'Enter Kusto cluster URL',
            placeHolder: 'https://your-cluster.kusto.windows.net',
            validateInput: (value) => {
                if (!value) {
                    return 'Cluster URL is required';
                }
                let testUrl = value.trim();
                if (!testUrl.startsWith('https://')) {
                    testUrl = 'https://' + testUrl;
                }
                const kustoUrlPattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]*\.(kusto|kustomfa|help\.kusto)\.windows\.net$/;
                const customDomainPattern = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]+(:\d+)?$/;
                if (kustoUrlPattern.test(testUrl) || customDomainPattern.test(testUrl)) {
                    return null;
                }
                return 'Please enter a valid Kusto cluster URL';
            }
        });
        if (clusterUrl) {
            // Get optional alias/display name for the cluster
            const clusterAlias = await vscode.window.showInputBox({
                prompt: 'Enter a display name for this cluster (optional)',
                placeHolder: 'e.g., "Production", "Help Cluster", "Analytics DB"',
                validateInput: (value) => {
                    // Alias is optional, so empty is allowed
                    if (value && value.trim().length > 50) {
                        return 'Display name should be 50 characters or less';
                    }
                    return null;
                }
            });
            await connectionProvider.addCluster(clusterUrl, clusterAlias?.trim());
        }
    });
    const refreshConnectionsCommand = vscode.commands.registerCommand('kustox.refreshConnections', () => {
        connectionProvider.refresh();
        vscode.window.showInformationMessage('Connection tree refreshed.');
    });
    const connectToDatabaseCommand = vscode.commands.registerCommand('kustox.connectToDatabase', (item) => {
        connectionProvider.connectToDatabase(item, (connection) => {
            exports.kustoConnection = kustoConnection = connection;
            updateConnectionStatus();
        });
    });
    const removeClusterCommand = vscode.commands.registerCommand('kustox.removeCluster', async (item) => {
        const answer = await vscode.window.showWarningMessage(`Are you sure you want to remove cluster "${item.item.name}"?`, 'Yes', 'No');
        if (answer === 'Yes') {
            connectionProvider.removeCluster(item);
        }
    });
    const editClusterNameCommand = vscode.commands.registerCommand('kustox.editClusterName', (item) => {
        connectionProvider.editClusterName(item);
    });
    const copyConnectionStringCommand = vscode.commands.registerCommand('kustox.copyConnectionString', (item) => {
        connectionProvider.copyConnectionString(item);
    });
    const insertTableNameCommand = vscode.commands.registerCommand('kustox.insertTableName', (item) => {
        if (item.item.type === 'table' && item.item.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'kusto') {
                const position = editor.selection.active;
                editor.edit(editBuilder => {
                    editBuilder.insert(position, item.item.name);
                });
                vscode.window.showInformationMessage(`Inserted table name: ${item.item.name}`);
            }
            else {
                vscode.window.showWarningMessage('Please open a Kusto (.kql) file to insert table names.');
            }
        }
    });
    const refreshTablesCommand = vscode.commands.registerCommand('kustox.refreshTables', (item) => {
        if (item.item.type === 'database' && item.item.cluster && item.item.database) {
            connectionProvider.refreshTableCache(item.item.cluster, item.item.database);
            vscode.window.showInformationMessage(`Table cache refreshed for ${item.item.database}`);
        }
    });
    // Mock data command for testing UI without external database
    const testWithMockDataCommand = vscode.commands.registerCommand('kustox.testWithMockData', async () => {
        const options = [
            { label: '$(table) Table Data (100 rows)', description: 'Mixed data types with realistic columns', value: 'table' },
            { label: '$(graph-line) Time Series Data (50 rows)', description: 'Time-based metrics data', value: 'timeseries' },
            { label: '$(shield) Security Data (75 rows)', description: 'Network security logs', value: 'security' },
            { label: '$(symbol-misc) Random Data', description: 'Custom row/column count', value: 'random' }
        ];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select mock data type for testing'
        });
        if (!selection)
            return;
        let mockResult;
        switch (selection.value) {
            case 'table':
                mockResult = mockDataGenerator_1.MockDataGenerator.generateTableData(100);
                break;
            case 'timeseries':
                mockResult = mockDataGenerator_1.MockDataGenerator.generateTimeSeriesData(50);
                break;
            case 'security':
                mockResult = mockDataGenerator_1.MockDataGenerator.generateSecurityData(75);
                break;
            case 'random':
                const rowInput = await vscode.window.showInputBox({
                    prompt: 'Number of rows',
                    value: '100',
                    validateInput: (value) => {
                        const num = parseInt(value);
                        return (isNaN(num) || num < 1 || num > 10000) ? 'Enter a number between 1 and 10000' : undefined;
                    }
                });
                if (!rowInput)
                    return;
                const colInput = await vscode.window.showInputBox({
                    prompt: 'Number of columns',
                    value: '10',
                    validateInput: (value) => {
                        const num = parseInt(value);
                        return (isNaN(num) || num < 1 || num > 50) ? 'Enter a number between 1 and 50' : undefined;
                    }
                });
                if (!colInput)
                    return;
                mockResult = mockDataGenerator_1.MockDataGenerator.generateRandomData(parseInt(rowInput), parseInt(colInput));
                break;
            default:
                return;
        }
        // Create mock connection for display
        const mockConnection = {
            cluster: 'https://localhost-mock.kusto.windows.net',
            database: 'MockTestData',
            client: null // Mock client
        };
        // Import and use webview manager
        const { showQueryResults } = await Promise.resolve().then(() => __importStar(require('./webview/webviewManager')));
        showQueryResults('MockQuery | take 100', mockResult, mockConnection, 'Mock Data Test');
        vscode.window.showInformationMessage(`Mock data generated: ${mockResult.rowCount} rows, ${mockResult.columns.length} columns`);
    });
    const openResultsExplorer = vscode.commands.registerCommand('kustox.openResultsExplorer', async () => {
        try {
            const uri = vscode.Uri.parse('kustox-ai://results/');
            await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
            vscode.window.showInformationMessage('Query results are now accessible in the virtual file system');
        }
        catch (error) {
            // Fallback: just open the README
            const readmeUri = vscode.Uri.parse('kustox-ai://results/README.md');
            await vscode.window.showTextDocument(readmeUri);
            vscode.window.showInformationMessage('AI can access query results through this virtual file system.');
        }
    });
    const exportResultsForAI = vscode.commands.registerCommand('kustox.exportResultsForAI', async () => {
        const results = resultsFileSystem.getAllResults();
        if (results.length === 0) {
            vscode.window.showWarningMessage('No query results available. Execute a query first.');
            return;
        }
        const latestResult = results[results.length - 1];
        const uri = vscode.Uri.parse(`kustox-ai://results/history/${latestResult.id}/result.json`);
        await vscode.window.showTextDocument(uri);
        vscode.window.showInformationMessage('JSON result format opened. AI agents can now analyze this data.');
    });
    const clearResultCache = vscode.commands.registerCommand('kustox.clearResultCache', async () => {
        const answer = await vscode.window.showWarningMessage('Clear all cached query results?', 'Yes', 'No');
        if (answer === 'Yes') {
            resultsFileSystem.clearCache();
            vscode.window.showInformationMessage('Query result cache cleared.');
        }
    });
    const showStorageStats = vscode.commands.registerCommand('kustox.showStorageStats', async () => {
        const stats = resultsFileSystem.getStorageStats();
        const statsMessage = `KustoX Query Results Storage:

📊 **Current Statistics**
• Storage Mode: Ephemeral (session-only)
• Results in Memory: ${stats.memoryCount}
• Total Memory Usage: ${stats.totalSizeMB.toFixed(2)} MB

🤖 **AI Integration**
• Results are automatically available to AI agents
• Visual tables remain unchanged for manual analysis  
• Format: JSON only (simplified for AI access)

⚙️ **Configuration**
• Adjust memory limit: kustox.results.maxMemoryResults
• Ephemeral storage only (no disk persistence)`;
        vscode.window.showInformationMessage(statsMessage, { modal: true });
    });
    const toggleVFSAutoOpen = vscode.commands.registerCommand('kustox.toggleVFSAutoOpen', async () => {
        const config = vscode.workspace.getConfiguration('kustox.ai');
        const currentValue = config.get('autoOpenVFS', false);
        const newValue = !currentValue;
        await config.update('autoOpenVFS', newValue, vscode.ConfigurationTarget.Global);
        // Update status bar
        updateVFSToggleStatus();
        const status = newValue ? 'ON' : 'OFF';
        const message = `VFS Auto-Open is now ${status}`;
        const detail = newValue
            ? 'Query results will automatically open in a file alongside the .kql file to help GitHub Copilot include them in context.'
            : 'Query results will only be available in the VFS tree view and visual display.';
        vscode.window.showInformationMessage(`${message}\n\n${detail}`, { modal: true });
    });
    // Push all commands to subscriptions
    context.subscriptions.push(openExplorer, helloWorld, createKustoFile, configureConnectionCommand, executeQueryCommand, disconnectKusto, showConnectionStatus, addClusterCommand, refreshConnectionsCommand, connectToDatabaseCommand, removeClusterCommand, editClusterNameCommand, copyConnectionStringCommand, insertTableNameCommand, refreshTablesCommand, testWithMockDataCommand, openResultsExplorer, exportResultsForAI, clearResultCache, showStorageStats, toggleVFSAutoOpen);
    // Show a welcome message when the extension activates
    vscode.window.showInformationMessage('KustoX extension loaded! Use "KustoX: Configure Connection" to connect to your cluster.');
}
exports.activate = activate;
function deactivate() {
    exports.kustoConnection = kustoConnection = null;
    if (connectionStatusBarItem) {
        connectionStatusBarItem.dispose();
    }
    if (vfsToggleStatusBarItem) {
        vfsToggleStatusBarItem.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map