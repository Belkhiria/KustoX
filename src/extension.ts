import * as vscode from 'vscode';
import { ConnectionTreeProvider, ConnectionTreeItem } from './connection/connectionTreeProvider';
import { ConnectionConfigurator } from './connection/connectionConfigurator';
import { QueryExecutor } from './query/queryExecutor';
import { KustoConnection } from './types';
import { MockDataGenerator } from './mockData/mockDataGenerator';

// Global connection state
let kustoConnection: KustoConnection | null = null;
let connectionStatusBarItem: vscode.StatusBarItem;

function updateConnectionStatus() {
    if (kustoConnection) {
        connectionStatusBarItem.text = `$(database) ${kustoConnection.cluster.split('//')[1]} / ${kustoConnection.database}`;
        connectionStatusBarItem.tooltip = `Connected to ${kustoConnection.cluster} database ${kustoConnection.database}`;
        connectionStatusBarItem.backgroundColor = undefined;
    } else {
        connectionStatusBarItem.text = `$(database) Not Connected`;
        connectionStatusBarItem.tooltip = 'Click to configure Kusto connection';
        connectionStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    connectionStatusBarItem.show();
}

export function activate(context: vscode.ExtensionContext) {
    console.log('KustoX extension is now active!');

    // Create status bar item
    connectionStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    connectionStatusBarItem.command = 'kustox.configureConnection';
    updateConnectionStatus();
    context.subscriptions.push(connectionStatusBarItem);

    // Create the connection tree provider
    const connectionProvider = new ConnectionTreeProvider(context);
    vscode.window.registerTreeDataProvider('kustoxConnections', connectionProvider);

    // Create utility instances
    const connectionConfigurator = new ConnectionConfigurator(
        (connection: KustoConnection) => {
            kustoConnection = connection;
            updateConnectionStatus();
            connectionProvider.refresh();
        },
        updateConnectionStatus
    );

    const queryExecutor = new QueryExecutor(() => kustoConnection);

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
        kustoConnection = null;
        updateConnectionStatus();
        connectionProvider.refresh();
        vscode.window.showInformationMessage('Disconnected from Kusto cluster.');
    });

    const showConnectionStatus = vscode.commands.registerCommand('kustox.showConnectionStatus', async () => {
        if (kustoConnection) {
            const info = `Connected to:\nCluster: ${kustoConnection.cluster}\nDatabase: ${kustoConnection.database}`;
            vscode.window.showInformationMessage(info);
        } else {
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

    const connectToDatabaseCommand = vscode.commands.registerCommand('kustox.connectToDatabase', (item: ConnectionTreeItem) => {
        connectionProvider.connectToDatabase(item, (connection: KustoConnection) => {
            kustoConnection = connection;
            updateConnectionStatus();
        });
    });

    const removeClusterCommand = vscode.commands.registerCommand('kustox.removeCluster', async (item: ConnectionTreeItem) => {
        const answer = await vscode.window.showWarningMessage(
            `Are you sure you want to remove cluster "${item.item.name}"?`,
            'Yes', 'No'
        );
        
        if (answer === 'Yes') {
            connectionProvider.removeCluster(item);
        }
    });

    const copyConnectionStringCommand = vscode.commands.registerCommand('kustox.copyConnectionString', (item: ConnectionTreeItem) => {
        connectionProvider.copyConnectionString(item);
    });

    const insertTableNameCommand = vscode.commands.registerCommand('kustox.insertTableName', (item: ConnectionTreeItem) => {
        if (item.item.type === 'table' && item.item.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'kusto') {
                const position = editor.selection.active;
                editor.edit(editBuilder => {
                    editBuilder.insert(position, item.item.name);
                });
                vscode.window.showInformationMessage(`Inserted table name: ${item.item.name}`);
            } else {
                vscode.window.showWarningMessage('Please open a Kusto (.kql) file to insert table names.');
            }
        }
    });

    const refreshTablesCommand = vscode.commands.registerCommand('kustox.refreshTables', (item: ConnectionTreeItem) => {
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

        if (!selection) return;

        let mockResult;
        switch (selection.value) {
            case 'table':
                mockResult = MockDataGenerator.generateTableData(100);
                break;
            case 'timeseries':
                mockResult = MockDataGenerator.generateTimeSeriesData(50);
                break;
            case 'security':
                mockResult = MockDataGenerator.generateSecurityData(75);
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
                if (!rowInput) return;

                const colInput = await vscode.window.showInputBox({
                    prompt: 'Number of columns',
                    value: '10',
                    validateInput: (value) => {
                        const num = parseInt(value);
                        return (isNaN(num) || num < 1 || num > 50) ? 'Enter a number between 1 and 50' : undefined;
                    }
                });
                if (!colInput) return;

                mockResult = MockDataGenerator.generateRandomData(parseInt(rowInput), parseInt(colInput));
                break;
            default:
                return;
        }

        // Create mock connection for display
        const mockConnection: KustoConnection = {
            cluster: 'https://localhost-mock.kusto.windows.net',
            database: 'MockTestData',
            client: null // Mock client
        };

        // Import and use webview manager
        const { showQueryResults } = await import('./webview/webviewManager');
        showQueryResults('MockQuery | take 100', mockResult, mockConnection, 'Mock Data Test');
        vscode.window.showInformationMessage(`Mock data generated: ${mockResult.rowCount} rows, ${mockResult.columns.length} columns`);
    });

    // Push all commands to subscriptions
    context.subscriptions.push(
        openExplorer, 
        helloWorld, 
        createKustoFile, 
        configureConnectionCommand, 
        executeQueryCommand, 
        disconnectKusto,
        showConnectionStatus,
        addClusterCommand,
        refreshConnectionsCommand,
        connectToDatabaseCommand,
        removeClusterCommand,
        copyConnectionStringCommand,
        insertTableNameCommand,
        refreshTablesCommand,
        testWithMockDataCommand
    );

    // Show a welcome message when the extension activates
    vscode.window.showInformationMessage('KustoX extension loaded! Use "KustoX: Configure Connection" to connect to your cluster.');
}

export function deactivate() {
    kustoConnection = null;
    if (connectionStatusBarItem) {
        connectionStatusBarItem.dispose();
    }
    console.log('KustoX extension is now deactivated!');
}

// Export for use by other modules
export { kustoConnection, updateConnectionStatus };
