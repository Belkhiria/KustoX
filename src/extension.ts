import * as vscode from 'vscode';
import { registerIntegrationTests } from './test/integrationTests';
import { registerComprehensiveTests } from './test/comprehensiveTests';

// Dynamic imports for azure-kusto-data
let KustoClient: any;
let KustoConnectionStringBuilder: any;
let ClientRequestProperties: any;

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
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

interface KustoConnection {
    client: any;
    cluster: string;
    database: string;
}

let kustoConnection: KustoConnection | null = null;

export function activate(context: vscode.ExtensionContext) {
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
            content: `// Welcome to KustoX - Modern Kusto Explorer!
// 
// 🔧 First: Configure your connection using "KustoX: Configure Connection"
//    💡 Tip: Choose "Simple Client ID" - easiest method from official docs!
//    📋 Default Client ID: 00001111-aaaa-2222-bbbb-3333cccc4444
// ▶️  Then: Press F5 or click the Run button to execute queries
//
// 📚 Sample queries for the public Samples database:

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

print "🚀 KustoX is ready! Configure your connection to get started."
`
        });
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('📄 New Kusto file created! Configure connection first, then press F5 to execute queries.');
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
                    method: 'device-code'
                },
                {
                    label: '�️ Azure CLI Authentication',
                    detail: 'Use existing Azure CLI login (az login required)',
                    method: 'azurecli'
                },
                {
                    label: '� Application Authentication',
                    detail: 'Use client ID and secret for service principal',
                    method: 'app'
                },
                {
                    label: '� Custom Client ID',
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

                let kcsb: any;

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
                        kcsb = KustoConnectionStringBuilder.withDeviceCodeAuthentication(clusterUrl, (message: string, url: string, code: string) => {
                            vscode.window.showInformationMessage(
                                `Device Code Authentication Required:\n\nCode: ${code}\n\nPlease visit: ${url}\n\nMessage: ${message}`,
                                'Open Browser'
                            ).then(selection => {
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

                        kcsb = KustoConnectionStringBuilder.withApplicationKeyAuthentication(
                            clusterUrl, appClientId, clientSecret, tenantId
                        );
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

                vscode.window.showInformationMessage(`✅ Successfully connected to ${clusterUrl}/${database}`);
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`❌ Failed to connect to Kusto: ${errorMessage}`);
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
            const configure = await vscode.window.showErrorMessage(
                'No Kusto connection configured. Would you like to configure one now?',
                'Configure Connection'
            );
            if (configure) {
                await configureKustoConnection();
                if (!kustoConnection) {
                    return;
                }
            } else {
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

                // Execute query with client request properties
                const response = await kustoConnection!.client.execute(
                    kustoConnection!.database, 
                    cleanQuery, 
                    crp
                );
                
                const executionTime = Date.now() - startTime;
                
                progress.report({ increment: 80, message: "Processing results..." });

                // Process the response using official patterns
                const results = processKustoResponse(response, executionTime);
                
                progress.report({ increment: 100, message: "Complete!" });

                // Show results in a new panel
                showQueryResults(query, results, kustoConnection!);
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`❌ Query execution failed: ${errorMessage}`);
            console.error('Query execution error:', error);
            
            // Show error details in results panel
            showQueryError(query, errorMessage, kustoConnection!);
        }
    }

    function processKustoResponse(response: any, executionTimeMs: number): any {
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
            const columns = primaryTable.columns.map((col: any) => col.columnName || col.name || 'Column');

            // Extract rows from the _rows property (this is the actual data)
            const rows: any[][] = [];
            if (primaryTable._rows && Array.isArray(primaryTable._rows)) {
                primaryTable._rows.forEach((row: any[]) => {
                    const formattedRow = row.map(cell => formatCellValue(cell));
                    rows.push(formattedRow);
                });
            } else {
                // Try the rows() iterator method as fallback
                try {
                    for (const kustoRow of primaryTable.rows()) {
                        // KustoResultRow has a 'raw' property with the actual data
                        const rowData = kustoRow.raw || Object.values(kustoRow).filter(val => 
                            val !== kustoRow.columns && Array.isArray(val)
                        )[0] || [];
                        
                        const formattedRow = rowData.map((cell: any) => formatCellValue(cell));
                        rows.push(formattedRow);
                    }
                } catch (iteratorError) {
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

        } catch (error) {
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

    function formatCellValue(cellValue: any): string {
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

    function showQueryResults(query: string, results: any, connection: KustoConnection) {
        // Create and show a new webview panel for results
        const panel = vscode.window.createWebviewPanel(
            'kustoResults',
            'Kusto Query Results',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getResultsWebviewContent(query, results, connection);
    }

    function showQueryError(query: string, errorMessage: string, connection: KustoConnection) {
        const panel = vscode.window.createWebviewPanel(
            'kustoError',
            'Kusto Query Error',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getErrorWebviewContent(query, errorMessage, connection);
    }

    function getResultsWebviewContent(query: string, results: any, connection: KustoConnection): string {
        const tableRows = results.rows.map((row: any[]) => 
            `<tr>${row.map((cell: any) => `<td title="${cell}">${cell}</td>`).join('')}</tr>`
        ).join('');

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
                    <span><strong>Rows:</strong> ${results.rowCount}${results.totalRows && results.totalRows !== results.rowCount ? ` of ${results.totalRows}` : ''}</span>
                </div>
                <div class="stat-item">
                    <span>📋</span>
                    <span><strong>Columns:</strong> ${results.columns.length}</span>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>${results.columns.map((col: string) => `<th>${col}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>`;
    }

    function getErrorWebviewContent(query: string, errorMessage: string, connection: KustoConnection): string {
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
    }

    context.subscriptions.push(openExplorer, helloWorld, createKustoFile, configureConnection, executeQuery, disconnectKusto);

    // Register integration tests
    registerIntegrationTests(context);
    
    // Register comprehensive tests
    registerComprehensiveTests(context);

    // Show a welcome message when the extension activates
    vscode.window.showInformationMessage('KustoX extension loaded! Use "KustoX: Configure Connection" to connect to your cluster.');
}

export function deactivate() {
    kustoConnection = null;
    console.log('KustoX extension is now deactivated!');
}
