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
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
// Dynamic imports for azure-kusto-data
let KustoClient;
let KustoConnectionStringBuilder;
async function loadKustoSDK() {
    if (!KustoClient) {
        const kustoModule = await import('azure-kusto-data');
        KustoClient = kustoModule.Client;
        KustoConnectionStringBuilder = kustoModule.KustoConnectionStringBuilder;
    }
}
let kustoConnection = null;
function activate(context) {
    console.log('KustoX extension is now active!');
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
            content: `// Welcome to KustoX!
// Configure your connection first using "KustoX: Configure Connection"
// Then write your Kusto queries here and press F5 to execute

// Example queries:
// StormEvents | take 10
// StormEvents | where State == "TEXAS" | project StartTime, EventType, DamageProperty | take 5

print "Hello from KustoX! Configure your connection to get started."
`
        });
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('New Kusto file created! Configure connection first, then press F5 to execute queries.');
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
                    label: '🌐 Interactive Browser (Recommended)',
                    detail: 'Simple browser authentication - no client ID needed',
                    method: 'interactive'
                },
                {
                    label: '📱 Device Code Authentication',
                    detail: 'Device code authentication for headless environments',
                    method: 'device'
                },
                {
                    label: '🔧 Azure CLI Authentication',
                    detail: 'Use existing Azure CLI login (az login required)',
                    method: 'azurecli'
                },
                {
                    label: '🔐 Application Authentication',
                    detail: 'Use client ID and secret for service principal',
                    method: 'app'
                },
                {
                    label: '🆔 Custom Client ID',
                    detail: 'Advanced: Use your own registered application client ID',
                    method: 'custom-client-id'
                }
            ], {
                placeHolder: 'Select authentication method',
                ignoreFocusOut: true
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
                    case 'device':
                        // Device code authentication
                        kcsb = KustoConnectionStringBuilder.withDeviceCodeAuthentication(clusterUrl, (message, url, code) => {
                            vscode.window.showInformationMessage(`Device Code Authentication Required:

Code: ${code}

Please visit: ${url}

Message: ${message}`, 'Open Browser').then(selection => {
                                if (selection === 'Open Browser') {
                                    vscode.env.openExternal(vscode.Uri.parse(url));
                                }
                            });
                        });
                        break;
                    case 'azurecli':
                        // Azure CLI authentication (requires az login)
                        kcsb = KustoConnectionStringBuilder.withAzLoginIdentity(clusterUrl);
                        break;
                    case 'app':
                        if (!authMethod) {
                            return;
                        }
                        await vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: "Connecting to Kusto cluster...",
                            cancellable: false
                        }, async (progress) => {
                            progress.report({ increment: 0 });
                            let connectionStringBuilder;
                            switch (authMethod.method) {
                                case 'interactive':
                                    // Interactive browser authentication (easiest)
                                    connectionStringBuilder = KustoConnectionStringBuilder.withAadUserPromptAuthentication(clusterUrl);
                                    break;
                                case 'device':
                                    connectionStringBuilder = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl);
                                    break;
                                case 'azurecli':
                                    connectionStringBuilder = KustoConnectionStringBuilder.withAzLoginIdentity(clusterUrl);
                                    break;
                                case 'clientid':
                                    // Simple client ID authentication (from Microsoft docs)
                                    const useDefaultClientId = await vscode.window.showQuickPick([
                                        {
                                            label: '📋 Use Default Client ID (Recommended)',
                                            detail: 'Use the client ID from Microsoft documentation: 00001111-aaaa-2222-bbbb-3333cccc4444',
                                            useDefault: true
                                        },
                                        {
                                            label: '✏️ Enter Custom Client ID',
                                            detail: 'Enter your own client ID',
                                            useDefault: false
                                        }
                                    ], {
                                        placeHolder: 'Choose client ID option',
                                        ignoreFocusOut: true
                                    });
                                    if (!useDefaultClientId) {
                                        return;
                                    }
                                    let clientIdToUse;
                                    if (useDefaultClientId.useDefault) {
                                        clientIdToUse = '00001111-aaaa-2222-bbbb-3333cccc4444'; // Default from docs
                                    }
                                    else {
                                        const customClientId = await vscode.window.showInputBox({
                                            prompt: 'Enter Client ID',
                                            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                                            ignoreFocusOut: true
                                        });
                                        if (!customClientId) {
                                            return;
                                        }
                                        clientIdToUse = customClientId;
                                    }
                                    // Application/Service Principal authentication
                                    const clientId = await vscode.window.showInputBox({
                                        prompt: 'Enter Application (Client) ID',
                                        placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                                        ignoreFocusOut: true
                                    });
                                    const clientSecret = await vscode.window.showInputBox({
                                        prompt: 'Enter Client Secret',
                                        password: true,
                                        ignoreFocusOut: true
                                    });
                                    const tenantId = await vscode.window.showInputBox({
                                        prompt: 'Enter Tenant ID',
                                        placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                                        ignoreFocusOut: true
                                    });
                                    if (!clientId || !clientSecret || !tenantId) {
                                        vscode.window.showErrorMessage('All application authentication fields are required');
                                        return;
                                    }
                                    kcsb = KustoConnectionStringBuilder.withAppKey(clusterUrl, clientId, clientSecret, tenantId);
                                    break;
                                default:
                                    throw new Error('Invalid authentication method');
                            }
                            progress.report({ increment: 50, message: "Creating client..." });
                            const client = new KustoClient(kcsb);
                            progress.report({ increment: 80, message: "Testing connection..." });
                            // Test the connection with a simple query
                            await client.execute(database, 'print "Connection test successful"');
                            progress.report({ increment: 100, message: "Connected!" });
                            kustoConnection = {
                                client,
                                cluster: clusterUrl,
                                database
                            };
                            vscode.window.showInformationMessage(`Connected to ${clusterUrl}/${database}`);
                        });
                }
                try { }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    vscode.window.showErrorMessage(`Failed to connect to Kusto: ${errorMessage}`);
                    console.error('Kusto connection error:', error);
                }
            }, async function executeKustoQuery() {
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
                // Get the query text (selected text or entire document)
                const query = editor.selection.isEmpty
                    ? editor.document.getText()
                    : editor.document.getText(editor.selection);
                if (!query.trim()) {
                    vscode.window.showErrorMessage('No query found. Please write a Kusto query first.');
                    return;
                }
                // Clean the query (remove comments and empty lines for execution)
                const cleanQuery = query.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('//'))
                    .join('\n');
                if (!cleanQuery.trim()) {
                    vscode.window.showErrorMessage('No executable query found. Please write a Kusto query (non-comment lines).');
                    return;
                }
                try {
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Executing Kusto Query...",
                        cancellable: false
                    }, async (progress) => {
                        progress.report({ increment: 0 });
                        const startTime = Date.now();
                        progress.report({ increment: 30, message: "Sending query to cluster..." });
                        const response = await kustoConnection.client.execute(kustoConnection.database, cleanQuery);
                        const executionTime = Date.now() - startTime;
                        progress.report({ increment: 80, message: "Processing results..." });
                        // Process the response
                        const results = processKustoResponse(response, executionTime);
                        progress.report({ increment: 100, message: "Complete!" });
                        // Show results in a new panel
                        showQueryResults(query, results, kustoConnection);
                    });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    vscode.window.showErrorMessage(`Query execution failed: ${errorMessage}`);
                    console.error('Query execution error:', error);
                    // Show error details in results panel
                    showQueryError(query, errorMessage, kustoConnection);
                }
            }, function processKustoResponse(response, executionTimeMs) {
                try {
                    // Handle different types of Kusto responses
                    if (!response || !response.primaryResults || response.primaryResults.length === 0) {
                        return {
                            columns: ['Result'],
                            rows: [['Query executed successfully but returned no data']],
                            executionTime: `${executionTimeMs}ms`,
                            rowCount: 0,
                            hasData: false
                        };
                    }
                    const primaryResult = response.primaryResults[0];
                    if (!primaryResult.rows || primaryResult.rows.length === 0) {
                        return {
                            columns: primaryResult.columns ? primaryResult.columns.map((col) => col.columnName || col.name || 'Column') : ['Result'],
                            rows: [['Query executed successfully but returned no rows']],
                            executionTime: `${executionTimeMs}ms`,
                            rowCount: 0,
                            hasData: false
                        };
                    }
                    // Extract column names
                    const columns = primaryResult.columns
                        ? primaryResult.columns.map((col) => col.columnName || col.name || 'Column')
                        : Array.from({ length: primaryResult.rows[0]?.length || 0 }, (_, i) => `Column${i + 1}`);
                    // Extract rows data
                    const rows = primaryResult.rows.map((row) => row.map(cell => {
                        if (cell === null || cell === undefined) {
                            return 'null';
                        }
                        if (typeof cell === 'object') {
                            return JSON.stringify(cell);
                        }
                        return String(cell);
                    }));
                    const executionTime = executionTimeMs < 1000
                        ? `${executionTimeMs}ms`
                        : `${(executionTimeMs / 1000).toFixed(2)}s`;
                    return {
                        columns,
                        rows,
                        executionTime,
                        rowCount: rows.length,
                        hasData: true
                    };
                }
                catch (error) {
                    console.error('Error processing Kusto response:', error);
                    return {
                        columns: ['Error'],
                        rows: [['Failed to process query results']],
                        executionTime: `${executionTimeMs}ms`,
                        rowCount: 0,
                        hasData: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }, function showQueryResults(query, results, connection) {
                // Create and show a new webview panel for results
                const panel = vscode.window.createWebviewPanel('kustoResults', 'Kusto Query Results', vscode.ViewColumn.Two, {
                    enableScripts: true
                });
                panel.webview.html = getResultsWebviewContent(query, results, connection);
            }, function showQueryError(query, errorMessage, connection) {
                const panel = vscode.window.createWebviewPanel('kustoError', 'Kusto Query Error', vscode.ViewColumn.Two, {
                    enableScripts: true
                });
                panel.webview.html = getErrorWebviewContent(query, errorMessage, connection);
            }, function getResultsWebviewContent(query, results, connection) {
                const tableRows = results.rows.map((row) => `<tr>${row.map((cell) => `<td title="${cell}">${cell}</td>`).join('')}</tr>`).join('');
                const statusClass = results.hasData ? 'success' : 'warning';
                const statusIcon = results.hasData ? '✓' : '⚠️';
                const statusText = results.hasData ? 'Query executed successfully' : 'Query executed with no data';
                return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kusto Query Results</title>
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
            <h2>🔍 Kusto Query Results</h2>
            <div class="connection-info">
                🔗 Connected to: <strong>${connection.cluster}</strong> / <strong>${connection.database}</strong>
            </div>
            <div class="query-info">
                <strong>📝 Executed Query:</strong><br>
                <div class="query-text">${query}</div>
            </div>
            <div class="stats">
                <div class="stat-item">
                    <span class="${statusClass}">${statusIcon}</span>
                    <span>${statusText}</span>
                </div>
                <div class="stat-item">
                    <span>⏱️</span>
                    <span><strong>Time:</strong> ${results.executionTime}</span>
                </div>
                <div class="stat-item">
                    <span>📊</span>
                    <span><strong>Rows:</strong> ${results.rowCount}</span>
                </div>
                <div class="stat-item">
                    <span>📋</span>
                    <span><strong>Columns:</strong> ${results.columns.length}</span>
                </div>
            </div>
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
        </body>
        </html>`;
            }, function getErrorWebviewContent(query, errorMessage, connection) {
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
                .error-info {
                    background-color: var(--vscode-inputValidation-errorBackground);
                    color: var(--vscode-inputValidation-errorForeground);
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    border-left: 3px solid var(--vscode-charts-red);
                }
                .query-text, .error-text {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                    white-space: pre-wrap;
                    line-height: 1.4;
                }
                .error {
                    color: var(--vscode-charts-red);
                }
            </style>
        </head>
        <body>
            <h2>❌ Kusto Query Error</h2>
            <div class="connection-info">
                🔗 Connected to: <strong>${connection.cluster}</strong> / <strong>${connection.database}</strong>
            </div>
            <div class="query-info">
                <strong>📝 Failed Query:</strong><br>
                <div class="query-text">${query}</div>
            </div>
            <div class="error-info">
                <strong>❌ Error Details:</strong><br>
                <div class="error-text">${errorMessage}</div>
            </div>
        </body>
        </html>`;
            }, context.subscriptions.push(openExplorer, helloWorld, createKustoFile, configureConnection, executeQuery, disconnectKusto));
            // Show a welcome message when the extension activates
            vscode.window.showInformationMessage('KustoX extension loaded! Use "KustoX: Configure Connection" to connect to your cluster.');
        }
        finally {
        }
        export function deactivate() {
            kustoConnection = null;
            console.log('KustoX extension is now deactivated!');
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension_new.js.map