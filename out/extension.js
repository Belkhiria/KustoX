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
exports.updateConnectionStatus = exports.kustoConnection = exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const connectionTreeProvider_1 = require("./connection/connectionTreeProvider");
const connectionConfigurator_1 = require("./connection/connectionConfigurator");
const queryExecutor_1 = require("./query/queryExecutor");
// Global connection state
let kustoConnection = null;
exports.kustoConnection = kustoConnection;
let connectionStatusBarItem;
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
function activate(context) {
    console.log('KustoX extension is now active!');
    // Create status bar item
    connectionStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    connectionStatusBarItem.command = 'kustox.configureConnection';
    updateConnectionStatus();
    context.subscriptions.push(connectionStatusBarItem);
    // Create the connection tree provider
    const connectionProvider = new connectionTreeProvider_1.ConnectionTreeProvider(context);
    vscode.window.registerTreeDataProvider('kustoxConnections', connectionProvider);
    // Create utility instances
    const connectionConfigurator = new connectionConfigurator_1.ConnectionConfigurator((connection) => {
        exports.kustoConnection = kustoConnection = connection;
        updateConnectionStatus();
        connectionProvider.refresh();
    }, updateConnectionStatus);
    const queryExecutor = new queryExecutor_1.QueryExecutor(() => kustoConnection);
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
            await connectionProvider.addCluster(clusterUrl);
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
    // Push all commands to subscriptions
    context.subscriptions.push(openExplorer, helloWorld, createKustoFile, configureConnectionCommand, executeQueryCommand, disconnectKusto, showConnectionStatus, addClusterCommand, refreshConnectionsCommand, connectToDatabaseCommand, removeClusterCommand, copyConnectionStringCommand, insertTableNameCommand, refreshTablesCommand);
    // Show a welcome message when the extension activates
    vscode.window.showInformationMessage('KustoX extension loaded! Use "KustoX: Configure Connection" to connect to your cluster.');
}
exports.activate = activate;
function deactivate() {
    exports.kustoConnection = kustoConnection = null;
    if (connectionStatusBarItem) {
        connectionStatusBarItem.dispose();
    }
    console.log('KustoX extension is now deactivated!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map