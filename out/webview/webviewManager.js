"use strict";
/**
 * Webview management for displaying results and errors
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
exports.showQueryError = exports.showQueryResults = void 0;
const vscode = __importStar(require("vscode"));
const chartUtils_1 = require("../visualization/chartUtils");
function showQueryResults(query, results, connection, title) {
    // Create and show a new webview panel for results
    const panelTitle = title || 'Kusto Query Results';
    const panel = vscode.window.createWebviewPanel('kustoResults', panelTitle, vscode.ViewColumn.Two, {
        enableScripts: true
    });
    panel.webview.html = getResultsWebviewContent(query, results, connection);
}
exports.showQueryResults = showQueryResults;
function showQueryError(query, errorDetails, connection, title) {
    const panelTitle = title ? `${title} - Error` : 'Kusto Query Error';
    const panel = vscode.window.createWebviewPanel('kustoError', panelTitle, vscode.ViewColumn.Three, // Use column 3 to avoid replacing results in column 2
    {
        enableScripts: true
    });
    panel.webview.html = getErrorWebviewContent(query, errorDetails, connection);
}
exports.showQueryError = showQueryError;
function getResultsWebviewContent(query, results, connection) {
    // Detect if query contains render command for visualization
    const renderMatch = query.match(/\|\s*render\s+(\w+)/i);
    const chartType = renderMatch ? renderMatch[1].toLowerCase() : null;
    const hasVisualization = chartType && ['columnchart', 'barchart', 'piechart', 'timechart', 'linechart', 'areachart', 'scatterchart'].includes(chartType);
    const tableRows = results.rows.map((row, rowIndex) => `<tr>${row.map((cell, cellIndex) => `<td>${cell}</td>`).join('')}</tr>`).join('');
    const statusClass = results.hasData ? 'success' : 'warning';
    const statusIcon = results.hasData ? '✓' : '⚠️';
    const statusText = results.hasData ? 'Query executed successfully' : 'Query executed with no data';
    // Generate chart HTML if visualization is requested
    const chartHtml = hasVisualization ? generateChartHtml(results, chartType) : '';
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kusto Query Results</title>
        
        <!-- DataTables CSS -->
        <link rel="stylesheet" href="https://cdn.datatables.net/2.3.2/css/dataTables.dataTables.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/buttons/2.4.2/css/buttons.dataTables.min.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/select/1.7.0/css/select.dataTables.min.css">
        <link rel="stylesheet" href="https://cdn.datatables.net/columncontrol/1.0.7/css/columnControl.dataTables.css">
        
        <!-- jQuery (required by DataTables) -->
        <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
        
        <!-- DataTables Core JS -->
        <script src="https://cdn.datatables.net/2.3.2/js/dataTables.js"></script>
        
        <!-- DataTables Extensions -->
        <script src="https://cdn.datatables.net/columncontrol/1.0.7/js/dataTables.columnControl.js"></script>
        <script src="https://cdn.datatables.net/columncontrol/1.0.7/js/columnControl.dataTables.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.2/js/dataTables.buttons.min.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.html5.min.js"></script>
        <script src="https://cdn.datatables.net/buttons/2.4.2/js/buttons.colVis.min.js"></script>
        <script src="https://cdn.datatables.net/select/1.7.0/js/dataTables.select.min.js"></script>
 <!-- Export dependencies -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>
        
        <!-- Chart.js for visualization -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        
        <style>
            ${getWebviewCSS()}
            
            /* Additional DataTables styling for Kusto results - Light Theme (Table Only) */
            .dataTables_wrapper {
                margin-top: 20px;
                background-color: #ffffff;
                color: #333333;
                border-radius: 4px;
                padding: 10px;
                border: 1px solid #dee2e6;
            }
            
            table.dataTable thead th {
                background-color: #f8f9fa;
                color: #212529;
                font-weight: 600;
                border-bottom: 2px solid #dee2e6;
                border-right: 1px solid #dee2e6;
            }
            
            table.dataTable tbody td {
                font-family: 'Cascadia Code', 'Courier New', monospace;
                font-size: 13px;
                background-color: #ffffff;
                color: #212529;
                border-bottom: 1px solid #dee2e6;
                border-right: 1px solid #dee2e6;
            }
            
            table.dataTable tbody tr:hover {
                background-color: #f8f9fa !important;
            }
            
            table.dataTable tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            table.dataTable tbody tr:nth-child(even):hover {
                background-color: #e9ecef !important;
            }
            
            /* Highlight timestamp columns */
            table.dataTable tbody td.timestamp-column {
                color: #0066cc;
                font-weight: 500;
            }
            
            /* Export buttons styling */
            .dt-buttons {
                margin-bottom: 10px;
            }
            
            .dt-button {
                background-color: #0078d4;
                color: white;
                border: none;
                padding: 5px 15px;
                margin-right: 5px;
                cursor: pointer;
                border-radius: 3px;
            }
            
            .dt-button:hover {
                background-color: #005a9e;
            }
            
            /* ColumnControl styling - Light Theme */
            .dt-columncontrol-search {
                background-color: #ffffff;
                border: 1px solid #ced4da;
                color: #495057;
                padding: 4px 8px;
                margin: 2px;
                border-radius: 3px;
                font-size: 12px;
            }
            
            .dt-columncontrol-search:focus {
                outline: 2px solid #0066cc;
                background-color: #ffffff;
                border-color: #0066cc;
            }
            
            .dt-columncontrol-searchList {
                background-color: #ffffff;
                border: 1px solid #ced4da;
                color: #495057;
                max-height: 200px;
                overflow-y: auto;
                border-radius: 3px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            .dt-columncontrol-searchList-item {
                padding: 6px 12px;
                cursor: pointer;
                border-bottom: 1px solid #e9ecef;
                background-color: #ffffff;
                color: #495057;
            }
            
            .dt-columncontrol-searchList-item:hover {
                background-color: #f8f9fa;
            }
            
            .dt-columncontrol-searchList-item.selected {
                background-color: #0066cc;
                color: #ffffff;
            }
            
            /* DataTables controls styling */
            .dataTables_filter input {
                background-color: #ffffff !important;
                border: 1px solid #ced4da !important;
                color: #495057 !important;
                padding: 6px 12px !important;
                border-radius: 4px !important;
            }
            
            .dataTables_filter input:focus {
                outline: 2px solid #0066cc !important;
                border-color: #0066cc !important;
            }
            
            .dataTables_length select {
                background-color: #ffffff !important;
                border: 1px solid #ced4da !important;
                color: #495057 !important;
                padding: 4px 8px !important;
                border-radius: 4px !important;
            }
            
            .dataTables_info {
                color: #6c757d !important;
            }
            
            .dataTables_paginate .paginate_button {
                background-color: #ffffff !important;
                border: 1px solid #ced4da !important;
                color: #495057 !important;
                margin: 0 2px !important;
                border-radius: 4px !important;
            }
            
            .dataTables_paginate .paginate_button:hover {
                background-color: #f8f9fa !important;
                border-color: #adb5bd !important;
            }
            
            .dataTables_paginate .paginate_button.current {
                background-color: #0066cc !important;
                color: #ffffff !important;
                border-color: #0066cc !important;
            }
        </style>
    </head>
    <body>
        <h2>🔍 Kusto Query Results</h2>
        <div class="connection-info">
            🔗 Connected to: <strong>${connection.cluster}</strong> / <strong>${connection.database}</strong>
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
            ${hasVisualization ? `<div class="stat-item"><span>📈</span><span><strong>Chart:</strong> ${chartType}</span></div>` : ''}
        </div>

        ${hasVisualization ? `
        <div class="results-tabs">
            <button class="tab-button active" onclick="showTab('chart')">📈 Chart</button>
            <button class="tab-button" onclick="showTab('table')">📋 Table</button>
        </div>

        <div id="chart-tab" class="tab-content active">
            ${chartHtml}
        </div>

        <div id="table-tab" class="tab-content">
            <table id="kusto-table" class="display nowrap" style="width:100%">
                <thead>
                    <tr>${results.columns.map((col) => `<th>${col}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
        ` : `
        <table id="kusto-table" class="display nowrap" style="width:100%">
            <thead>
                <tr>${results.columns.map((col) => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        `}

        <script>
            let dataTable = null;
            
            // Detect column types based on data
            function detectColumnTypes(data, columns) {
                const columnTypes = {};
                
                columns.forEach((col, index) => {
                    let isDate = true;
                    let isNumber = true;
                    
                    // Check first 10 rows to determine column type
                    for (let i = 0; i < Math.min(10, data.length); i++) {
                        const value = data[i][index];
                        if (value !== null && value !== undefined && value !== '') {
                            // Check if it's a date (ISO format or common date patterns)
                            if (isDate && !((/^\\d{4}-\\d{2}-\\d{2}/.test(value.toString())) || 
                                           (/^\\d{1,2}\\/\\d{1,2}\\/\\d{4}/.test(value.toString())) ||
                                           (/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/.test(value.toString())))) {
                                isDate = false;
                            }
                            // Check if it's a number
                            if (isNumber && (isNaN(value) || !isFinite(value))) {
                                isNumber = false;
                            }
                        }
                    }
                    
                    if (isDate) {
                        columnTypes[index] = 'date';
                    } else if (isNumber) {
                        columnTypes[index] = 'num';
                    } else {
                        columnTypes[index] = 'string';
                    }
                });
                
                return columnTypes;
            }
            
            function initializeDataTable() {
                // Check if DataTables is loaded
                if (typeof $ === 'undefined' || typeof $.fn.dataTable === 'undefined') {
                    console.warn('DataTables not loaded, falling back to basic table');
                    return;
                }
                
                console.log('Initializing DataTable...');
                console.log('Table element exists:', $('#kusto-table').length > 0);
                
                // Get table data for column type detection
                const tableData = [];
                $('#kusto-table tbody tr').each(function() {
                    const rowData = [];
                    $(this).find('td').each(function() {
                        rowData.push($(this).text());
                    });
                    tableData.push(rowData);
                });
                
                const columns = [];
                $('#kusto-table thead th').each(function() {
                    columns.push($(this).text());
                });
                
                console.log('Found', tableData.length, 'rows and', columns.length, 'columns');
                
                const columnTypes = detectColumnTypes(tableData, columns);
                
                // Build column definitions with ColumnControl
                const columnDefs = [];
                
                // Add timestamp class to date columns and configure ColumnControl
                columns.forEach((col, index) => {
                    if (columnTypes[index] === 'date') {
                        columnDefs.push({
                            targets: index,
                            className: 'timestamp-column',
                            columnControl: ['order', ['searchList']]  // Enable search list for date columns
                        });
                    } else if (columnTypes[index] === 'string') {
                        columnDefs.push({
                            targets: index,
                            columnControl: ['order', ['searchList']]  // Enable search list for string columns
                        });
                    } else {
                        columnDefs.push({
                            targets: index,
                            columnControl: ['order', ['search']]  // Basic search for numeric columns
                        });
                    }
                });
                
                // Initialize DataTable with configuration
                try {
                    dataTable = $('#kusto-table').DataTable({
                        // Basic options - optimized for performance
                        paging: true,
                        pageLength: 50,  // Reduced from 100 for better performance
                        lengthMenu: [[25, 50, 100, 250, -1], [25, 50, 100, 250, "All"]],
                        
                        // Searching
                        searching: true,
                        search: {
                            smart: true,
                            regex: false
                        },
                        
                        // ColumnControl configuration
                        columnControl: ['order', ['search']],  // Default configuration for all columns
                        
                        // Sorting
                        ordering: true,
                        order: [], // No default sorting, preserve Kusto's order
                        
                        // Scrolling
                        scrollX: true,
                        scrollY: '60vh',
                        scrollCollapse: true,
                        
                        // Performance optimizations
                        deferRender: true,
                        processing: false,
                        serverSide: false,
                        
                        // Column definitions
                        columnDefs: columnDefs,
                        
                        // Simplified buttons (removed SearchPanes for performance)
                        dom: 'Bfrtip',
                        buttons: [
                            {
                                extend: 'copy',
                                text: '📋 Copy',
                                className: 'dt-button-copy'
                            },
                            {
                                extend: 'csv',
                                text: '📄 CSV',
                                className: 'dt-button-csv'
                            },
                            {
                                extend: 'excel',
                                text: '📊 Excel',
                                className: 'dt-button-excel'
                            },
                            {
                                extend: 'colvis',
                                text: '👁️ Columns',
                                className: 'dt-button-colvis'
                            }
                        ],
                        
                        // Language
                        language: {
                            search: "Search in results:",
                            lengthMenu: "Show _MENU_ rows",
                            info: "Showing _START_ to _END_ of _TOTAL_ results",
                            paginate: {
                                first: "First",
                                last: "Last",
                                next: "Next",
                                previous: "Previous"
                            }
                        }
                    });
                    
                    console.log('✅ DataTables initialized successfully with', columns.length, 'columns');
                } catch (error) {
                    console.error('❌ Failed to initialize DataTables:', error);
                    console.log('Falling back to basic table display');
                }
            }

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
                
                // Initialize DataTable when switching to table tab
                if (tabName === 'table' && !dataTable) {
                    setTimeout(initializeDataTable, 100);
                }
            }
            
            // Initialize DataTable on DOM ready
            $(document).ready(function() {
                // Check if we're showing the table tab initially
                const chartTab = document.getElementById('chart-tab');
                if (!chartTab || !chartTab.classList.contains('active')) {
                    initializeDataTable();
                }
            });
            
            // Handle window resize
            $(window).on('resize', function() {
                if (dataTable) {
                    dataTable.columns.adjust();
                }
            });



            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM loaded, initializing DataTables');
                // Check if we're showing the table tab initially
                const chartTab = document.getElementById('chart-tab');
                if (!chartTab || !chartTab.classList.contains('active')) {
                    initializeDataTable();
                }
            });
        </script>
    </body>
    </html>`;
}
function generateChartHtml(results, chartType) {
    const chartId = `chart-${Date.now()}`;
    // Prepare data for Chart.js
    const chartData = (0, chartUtils_1.prepareChartData)(results, chartType);
    return `
        <div class="chart-container">
            <div class="chart-title">${(0, chartUtils_1.getChartTitle)(chartType)} - ${results.rowCount} Data Points</div>
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

                ${(0, chartUtils_1.generateChartScript)(chartData, chartType)}
            })();
        </script>
    `;
}
function getErrorWebviewContent(query, errorDetails, connection) {
    // Handle both old string format and new detailed format for backward compatibility
    const details = typeof errorDetails === 'string'
        ? { summary: errorDetails, details: errorDetails, category: 'Error', severity: 'Error', code: '' }
        : errorDetails;
    // Check if this is a query limit exceeded error for special formatting
    const isQueryLimitError = details.summary.includes('E_QUERY_RESULT_SET_TOO_LARGE') ||
        details.summary.includes('80DA0003') ||
        details.summary.includes('exceeded the allowed limits') ||
        details.summary.includes('64 MB');
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kusto Query Error</title>
        <style>
            ${getWebviewCSS()}
            .error-container { background-color: var(--vscode-inputValidation-errorBackground); }
        </style>
    </head>
    <body>
        <h2>❌ Query Error</h2>
        <div class="connection-info">
            🔗 Connected to: <strong>${connection.cluster}</strong> / <strong>${connection.database}</strong>
        </div>
        <div class="error-container">
            <h3>${details.category} Error</h3>
            <p><strong>Summary:</strong> ${details.summary}</p>
            <p><strong>Details:</strong> ${details.details}</p>
            ${details.code ? `<p><strong>Error Code:</strong> ${details.code}</p>` : ''}
        </div>
        ${isQueryLimitError ? getQueryLimitErrorHelp() : ''}
    </body>
    </html>`;
}
function getQueryLimitErrorHelp() {
    return `
        <div class="help-section">
            <h3>💡 How to fix this:</h3>
            <ul>
                <li>Add filters to reduce data: <code>| where column == "value"</code></li>
                <li>Use summarize operations: <code>| summarize count() by column</code></li>
                <li>Limit results: <code>| take 1000</code></li>
                <li>Use sample operator: <code>| sample 10000</code></li>
            </ul>
        </div>
    `;
}
function getWebviewCSS() {
    return `
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 20px;
            line-height: 1.5;
        }
        .connection-info {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 12px;
            border: 1px solid var(--vscode-inputValidation-infoBorder);
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
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid var(--vscode-contrastBorder);
        }
        .results-tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-tab-inactiveBackground);
            border-radius: 4px 4px 0 0;
        }
        .tab-button {
            padding: 10px 20px;
            background: none;
            border: none;
            color: var(--vscode-tab-inactiveForeground);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            font-family: var(--vscode-font-family);
            font-weight: 500;
        }
        .tab-button.active {
            border-bottom-color: var(--vscode-tab-activeBorder);
            color: var(--vscode-tab-activeForeground);
            font-weight: 600;
            background-color: var(--vscode-tab-activeBackground);
        }
        .tab-button:hover {
            background-color: var(--vscode-tab-hoverBackground);
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
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
        }
        
        /* Light theme styling for table only */
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            table-layout: auto;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            overflow: hidden;
        }
        th, td {
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid #dee2e6;
            position: relative;
            min-width: 50px;
            border-right: 1px solid #dee2e6;
            vertical-align: top;
            height: auto;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
            user-select: none;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .success {
            color: var(--vscode-testing-iconPassed);
            font-weight: 600;
        }
        .warning {
            color: var(--vscode-testing-iconQueued);
            font-weight: 600;
        }
        .table-container {
            max-height: 60vh;
            overflow: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .error-container {
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            background-color: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
        }
        .help-section {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
            border: 1px solid var(--vscode-inputValidation-infoBorder);
        }
        h2 {
            color: var(--vscode-editor-foreground);
            margin-top: 0;
        }
        h3 {
            color: var(--vscode-editor-foreground);
        }
    `;
}
//# sourceMappingURL=webviewManager.js.map