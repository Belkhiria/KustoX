import * as vscode from 'vscode';

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
            content: `// Welcome to KustoX!
// Start writing your Kusto queries here
// Press F5 to execute the query

StormEvents
| where EventType == "Tornado"
| project StartTime, State, EventType, DamageProperty
| sort by DamageProperty desc
| take 10`
        });
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('New Kusto file created! Press F5 to execute queries.');
    });

    const executeQuery = vscode.commands.registerCommand('kustox.executeQuery', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a Kusto (.kql) file.');
            return;
        }

        if (editor.document.languageId !== 'kusto') {
            vscode.window.showErrorMessage('Please open a Kusto (.kql) file to execute queries.');
            return;
        }

        // Get the query text (selected text or entire document)
        const query = editor.selection.isEmpty 
            ? editor.document.getText() 
            : editor.document.getText(editor.selection);

        if (!query.trim()) {
            vscode.window.showErrorMessage('No query found. Please write a Kusto query first.');
            return;
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Executing Kusto Query...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });

            // Simulate query execution with mock data
            await new Promise(resolve => setTimeout(resolve, 1000));
            progress.report({ increment: 50, message: "Processing results..." });

            await new Promise(resolve => setTimeout(resolve, 500));
            progress.report({ increment: 100, message: "Complete!" });

            // Show results in a new panel
            showQueryResults(query);
        });
    });

    function showQueryResults(query: string) {
        // Create and show a new webview panel for results
        const panel = vscode.window.createWebviewPanel(
            'kustoResults',
            'Kusto Query Results',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        // Generate mock results based on the query
        const mockResults = generateMockResults(query);

        panel.webview.html = getResultsWebviewContent(query, mockResults);
    }

    function generateMockResults(query: string): any {
        // Parse the query to understand what data to return
        const queryLower = query.toLowerCase().trim();
        const lines = query.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
        
        // Analyze the query structure
        const analysis = analyzeKustoQuery(queryLower, lines);
        
        // Generate appropriate mock data based on analysis
        if (analysis.tableName) {
            return generateTableSpecificResults(analysis);
        } else {
            return generateGenericResults(analysis);
        }
    }

    function analyzeKustoQuery(queryLower: string, lines: string[]): any {
        const analysis: any = {
            tableName: null,
            columns: [],
            operations: [],
            filters: [],
            aggregations: [],
            sorting: null,
            limit: null
        };

        // Extract table name (first non-comment line usually contains the table)
        const firstLine = lines[0]?.toLowerCase() || '';
        const tableMatch = firstLine.match(/^(\w+)/);
        if (tableMatch) {
            analysis.tableName = tableMatch[1];
        }

        // Extract projected columns
        const projectMatch = queryLower.match(/\|\s*project\s+([^|]+)/);
        if (projectMatch) {
            analysis.columns = projectMatch[1].split(',').map(col => col.trim());
        }

        // Extract filters
        const whereMatches = queryLower.matchAll(/\|\s*where\s+([^|]+)/g);
        for (const match of whereMatches) {
            analysis.filters.push(match[1].trim());
        }

        // Extract aggregations
        if (queryLower.includes('| summarize') || queryLower.includes('| count')) {
            analysis.operations.push('aggregation');
        }

        // Extract sorting
        const sortMatch = queryLower.match(/\|\s*sort\s+by\s+([^|]+)/);
        if (sortMatch) {
            analysis.sorting = sortMatch[1].trim();
        }

        // Extract limit/take
        const takeMatch = queryLower.match(/\|\s*take\s+(\d+)/);
        if (takeMatch) {
            analysis.limit = parseInt(takeMatch[1]);
        }

        // Extract distinct
        if (queryLower.includes('| distinct')) {
            analysis.operations.push('distinct');
        }

        return analysis;
    }

    function generateTableSpecificResults(analysis: any): any {
        const tableName = analysis.tableName.toLowerCase();
        let columns, rows, baseRowCount;

        // Generate data based on known table patterns
        if (tableName.includes('storm') || tableName.includes('event')) {
            ({ columns, rows } = generateStormEventsData(analysis));
            baseRowCount = 1000;
        } else if (tableName.includes('log') || tableName.includes('trace')) {
            ({ columns, rows } = generateLogData(analysis));
            baseRowCount = 5000;
        } else if (tableName.includes('performance') || tableName.includes('perf')) {
            ({ columns, rows } = generatePerformanceData(analysis));
            baseRowCount = 2000;
        } else if (tableName.includes('security') || tableName.includes('auth')) {
            ({ columns, rows } = generateSecurityData(analysis));
            baseRowCount = 800;
        } else {
            ({ columns, rows } = generateGenericTableData(analysis));
            baseRowCount = 1500;
        }

        // Apply query operations to adjust row count
        let finalRowCount = baseRowCount;
        if (analysis.filters.length > 0) {
            finalRowCount = Math.floor(baseRowCount * 0.3); // Filters reduce results
        }
        if (analysis.limit) {
            finalRowCount = Math.min(finalRowCount, analysis.limit);
            rows = rows.slice(0, analysis.limit);
        }

        const executionTime = generateExecutionTime(finalRowCount);

        return {
            columns,
            rows,
            executionTime,
            rowCount: finalRowCount,
            tableName: analysis.tableName
        };
    }

    function generateStormEventsData(analysis: any) {
        const defaultColumns = ['StartTime', 'State', 'EventType', 'DamageProperty', 'Source'];
        const columns = analysis.columns.length > 0 ? analysis.columns : defaultColumns;
        
        const eventTypes = ['Tornado', 'Hail', 'Thunderstorm Wind', 'Flash Flood', 'Drought'];
        const states = ['TEXAS', 'OKLAHOMA', 'KANSAS', 'MISSOURI', 'ARKANSAS', 'NEBRASKA'];
        
        const rows = [];
        for (let i = 0; i < Math.min(15, analysis.limit || 15); i++) {
            const row = [];
            for (const col of columns) {
                const colLower = col.toLowerCase();
                if (colLower.includes('time') || colLower.includes('date')) {
                    row.push(`2024-0${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
                } else if (colLower.includes('state')) {
                    row.push(states[Math.floor(Math.random() * states.length)]);
                } else if (colLower.includes('event') || colLower.includes('type')) {
                    row.push(eventTypes[Math.floor(Math.random() * eventTypes.length)]);
                } else if (colLower.includes('damage') || colLower.includes('property')) {
                    row.push(Math.floor(Math.random() * 200000) + 10000);
                } else if (colLower.includes('source')) {
                    row.push('Storm Prediction Center');
                } else {
                    row.push(`Value_${i + 1}`);
                }
            }
            rows.push(row);
        }
        
        return { columns, rows };
    }

    function generateLogData(analysis: any) {
        const defaultColumns = ['Timestamp', 'Level', 'Message', 'Component', 'RequestId'];
        const columns = analysis.columns.length > 0 ? analysis.columns : defaultColumns;
        
        const levels = ['Info', 'Warning', 'Error', 'Debug', 'Critical'];
        const components = ['Authentication', 'Database', 'API', 'Cache', 'Queue'];
        const messages = [
            'Request processed successfully',
            'Database connection timeout',
            'Invalid authentication token',
            'Cache miss for key',
            'Queue processing started'
        ];
        
        const rows = [];
        for (let i = 0; i < Math.min(12, analysis.limit || 12); i++) {
            const row = [];
            for (const col of columns) {
                const colLower = col.toLowerCase();
                if (colLower.includes('time') || colLower.includes('date')) {
                    row.push(`2024-07-29T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}Z`);
                } else if (colLower.includes('level')) {
                    row.push(levels[Math.floor(Math.random() * levels.length)]);
                } else if (colLower.includes('message')) {
                    row.push(messages[Math.floor(Math.random() * messages.length)]);
                } else if (colLower.includes('component')) {
                    row.push(components[Math.floor(Math.random() * components.length)]);
                } else if (colLower.includes('request') || colLower.includes('id')) {
                    row.push(`req_${Math.random().toString(36).substring(2, 8)}`);
                } else {
                    row.push(`LogValue_${i + 1}`);
                }
            }
            rows.push(row);
        }
        
        return { columns, rows };
    }

    function generatePerformanceData(analysis: any) {
        const defaultColumns = ['Timestamp', 'CounterName', 'Value', 'Computer', 'Instance'];
        const columns = analysis.columns.length > 0 ? analysis.columns : defaultColumns;
        
        const counterNames = ['CPU Usage', 'Memory Usage', 'Disk I/O', 'Network Throughput', 'Response Time'];
        const computers = ['Server01', 'Server02', 'Web01', 'DB01', 'Cache01'];
        
        const rows = [];
        for (let i = 0; i < Math.min(10, analysis.limit || 10); i++) {
            const row = [];
            for (const col of columns) {
                const colLower = col.toLowerCase();
                if (colLower.includes('time') || colLower.includes('date')) {
                    row.push(`2024-07-29T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
                } else if (colLower.includes('counter') || colLower.includes('name')) {
                    row.push(counterNames[Math.floor(Math.random() * counterNames.length)]);
                } else if (colLower.includes('value')) {
                    row.push((Math.random() * 100).toFixed(2));
                } else if (colLower.includes('computer') || colLower.includes('machine')) {
                    row.push(computers[Math.floor(Math.random() * computers.length)]);
                } else if (colLower.includes('instance')) {
                    row.push(`Instance_${i + 1}`);
                } else {
                    row.push(`PerfValue_${i + 1}`);
                }
            }
            rows.push(row);
        }
        
        return { columns, rows };
    }

    function generateSecurityData(analysis: any) {
        const defaultColumns = ['Timestamp', 'User', 'Action', 'Resource', 'Result'];
        const columns = analysis.columns.length > 0 ? analysis.columns : defaultColumns;
        
        const users = ['alice@company.com', 'bob@company.com', 'charlie@company.com', 'system', 'admin'];
        const actions = ['Login', 'Logout', 'FileAccess', 'PermissionChange', 'DataExport'];
        const resources = ['/api/users', '/admin/settings', '/data/reports', '/system/config', '/app/dashboard'];
        const results = ['Success', 'Failed', 'Blocked', 'Warning'];
        
        const rows = [];
        for (let i = 0; i < Math.min(8, analysis.limit || 8); i++) {
            const row = [];
            for (const col of columns) {
                const colLower = col.toLowerCase();
                if (colLower.includes('time') || colLower.includes('date')) {
                    row.push(`2024-07-29T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
                } else if (colLower.includes('user')) {
                    row.push(users[Math.floor(Math.random() * users.length)]);
                } else if (colLower.includes('action')) {
                    row.push(actions[Math.floor(Math.random() * actions.length)]);
                } else if (colLower.includes('resource')) {
                    row.push(resources[Math.floor(Math.random() * resources.length)]);
                } else if (colLower.includes('result') || colLower.includes('status')) {
                    row.push(results[Math.floor(Math.random() * results.length)]);
                } else {
                    row.push(`SecValue_${i + 1}`);
                }
            }
            rows.push(row);
        }
        
        return { columns, rows };
    }

    function generateGenericTableData(analysis: any) {
        const defaultColumns = analysis.columns.length > 0 ? analysis.columns : ['Column1', 'Column2', 'Column3'];
        const columns = defaultColumns;
        
        const rows = [];
        for (let i = 0; i < Math.min(6, analysis.limit || 6); i++) {
            const row = columns.map((_: string, index: number) => `Value_${i + 1}_${index + 1}`);
            rows.push(row);
        }
        
        return { columns, rows };
    }

    function generateGenericResults(analysis: any): any {
        return {
            columns: ['Result'],
            rows: [['Query executed successfully'], ['No specific table detected'], ['Showing generic response']],
            executionTime: '0.5s',
            rowCount: 3
        };
    }

    function generateExecutionTime(rowCount: number): string {
        // Simulate realistic execution times based on row count
        let seconds = 0.1 + (rowCount / 10000);
        if (seconds < 1) {
            return `${(seconds * 1000).toFixed(0)}ms`;
        } else {
            return `${seconds.toFixed(1)}s`;
        }
    }

    function getResultsWebviewContent(query: string, results: any): string {
        const tableRows = results.rows.map((row: any[]) => 
            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('');

        const queryInfo = results.tableName ? 
            `<div class="table-info">📊 Table: <strong>${results.tableName}</strong></div>` : '';

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Query Results</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 20px;
                }
                .query-info {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                    border-left: 3px solid var(--vscode-charts-blue);
                }
                .table-info {
                    margin-bottom: 15px;
                    padding: 8px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    border-radius: 4px;
                    font-size: 14px;
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
                }
                th {
                    background-color: var(--vscode-panel-background);
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                }
                tr:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }
                .success {
                    color: var(--vscode-charts-green);
                }
                .query-text {
                    font-family: var(--vscode-editor-font-family);
                    font-size: 13px;
                    white-space: pre-wrap;
                    line-height: 1.4;
                }
            </style>
        </head>
        <body>
            <h2>🔍 Query Results</h2>
            ${queryInfo}
            <div class="query-info">
                <strong>📝 Executed Query:</strong><br>
                <div class="query-text">${query}</div>
            </div>
            <div class="stats">
                <div class="stat-item">
                    <span class="success">✓</span>
                    <span>Query executed successfully</span>
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
            <table>
                <thead>
                    <tr>${results.columns.map((col: string) => `<th>${col}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </body>
        </html>`;
    }

    context.subscriptions.push(openExplorer, helloWorld, createKustoFile, executeQuery);

    // Show a welcome message when the extension activates
    vscode.window.showInformationMessage('KustoX extension loaded! Try Ctrl+Shift+P and search for "KustoX"');
}

export function deactivate() {
    console.log('KustoX extension is now deactivated!');
}
