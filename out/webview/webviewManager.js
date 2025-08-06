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
    const tableRows = results.rows.map((row, rowIndex) => `<tr data-row="${rowIndex}">${row.map((cell, cellIndex) => `<td data-column="${cellIndex}" data-value="${cell}" title="${cell}"><div class="row-resize-handle"></div>${cell}</td>`).join('')}</tr>`).join('');
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
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            ${getWebviewCSS()}
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
            <div class="table-container">
                <table>
                    <thead>
                        <tr>${results.columns.map((col, index) => `<th data-column="${index}" class="sortable">${col}<span class="sort-indicator"></span><div class="resize-handle"></div></th>`).join('')}</tr>
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
                    <tr>${results.columns.map((col, index) => `<th data-column="${index}" class="sortable">${col}<span class="sort-indicator"></span><div class="resize-handle"></div></th>`).join('')}</tr>
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

            // Column resize functionality
            let isResizing = false;
            let currentColumn = null;
            let currentHandle = null;
            let startX = 0;
            let startWidth = 0;

            // Row resize functionality
            let isRowResizing = false;
            let currentRow = null;
            let currentRowHandle = null;
            let startY = 0;
            let startHeight = 0;

            // Sorting state
            let currentSort = { column: -1, direction: 'none' };

            function sortTable(columnIndex, table) {
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                // Determine sort direction
                let direction = 'asc';
                if (currentSort.column === columnIndex) {
                    if (currentSort.direction === 'asc') {
                        direction = 'desc';
                    } else if (currentSort.direction === 'desc') {
                        direction = 'asc';
                    }
                } else {
                    direction = 'asc';
                }
                
                // Update sort state
                currentSort = { column: columnIndex, direction: direction };
                
                // Update header indicators
                const headers = table.querySelectorAll('th');
                headers.forEach((header, index) => {
                    header.classList.remove('sort-asc', 'sort-desc');
                    if (index === columnIndex) {
                        header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
                    }
                });
                
                // Sort rows
                rows.sort((a, b) => {
                    const cellA = a.querySelector('td[data-column="' + columnIndex + '"]');
                    const cellB = b.querySelector('td[data-column="' + columnIndex + '"]');
                    
                    if (!cellA || !cellB) return 0;
                    
                    const valueA = cellA.getAttribute('data-value') || cellA.textContent;
                    const valueB = cellB.getAttribute('data-value') || cellB.textContent;
                    
                    let comparison = 0;
                    
                    const valueAStr = valueA.toString().trim();
                    const valueBStr = valueB.toString().trim();
                    
                    console.log('Comparing values:', valueAStr, 'vs', valueBStr);
                    
                    // Try to parse as dates first
                    const dateA = new Date(valueAStr);
                    const dateB = new Date(valueBStr);
                    
                    // Check if both parsed as valid dates
                    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                        console.log('Sorting as dates:', dateA, 'vs', dateB);
                        comparison = dateA.getTime() - dateB.getTime();
                        console.log('Date comparison result:', comparison);
                    } else {
                        // Try numeric comparison first
                        const numA = parseFloat(valueAStr);
                        const numB = parseFloat(valueBStr);
                        
                        if (!isNaN(numA) && !isNaN(numB) && 
                            isFinite(numA) && isFinite(numB)) {
                            comparison = numA - numB;
                        } else {
                            // String comparison
                            comparison = valueAStr.localeCompare(valueBStr, undefined, { numeric: true });
                        }
                    }
                    
                    return direction === 'asc' ? comparison : -comparison;
                });
                
                // Reorder DOM
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
            }

            function initializeResizing() {
                // Add sorting functionality to column headers
                document.querySelectorAll('th.sortable').forEach((header, index) => {
                    header.addEventListener('click', function(e) {
                        // Don't sort if clicking on resize handle
                        if (e.target.classList.contains('resize-handle')) {
                            return;
                        }
                        
                        const columnIndex = parseInt(this.getAttribute('data-column'));
                        const table = this.closest('table');
                        sortTable(columnIndex, table);
                        
                        e.preventDefault();
                        e.stopPropagation();
                    });
                });

                // Add resize functionality to all resize handles
                document.querySelectorAll('.resize-handle').forEach((handle, index) => {
                    handle.addEventListener('mousedown', function(e) {
                        console.log('Resize handle clicked:', index);
                        isResizing = true;
                        currentColumn = this.parentElement;
                        currentHandle = this;
                        startX = e.clientX;
                        // Get the current width, not the computed style which might be auto
                        startWidth = currentColumn.offsetWidth;
                        
                        currentColumn.classList.add('resizing');
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                        
                        e.preventDefault();
                        e.stopPropagation();
                    });
                });

                // Add row resize functionality
                document.querySelectorAll('.row-resize-handle').forEach((handle, index) => {
                    handle.addEventListener('mousedown', function(e) {
                        console.log('Row resize handle clicked:', index);
                        isRowResizing = true;
                        currentRow = this.closest('tr');
                        currentRowHandle = this;
                        startY = e.clientY;
                        startHeight = currentRow.offsetHeight;
                        
                        currentRow.classList.add('resizing');
                        document.body.style.cursor = 'row-resize';
                        document.body.style.userSelect = 'none';
                        
                        e.preventDefault();
                        e.stopPropagation();
                    });
                });

                document.addEventListener('mousemove', function(e) {
                    // Column resizing
                    if (isResizing && currentColumn) {
                        const deltaX = e.clientX - startX;
                        const newWidth = startWidth + deltaX;
                        
                        if (newWidth > 30) { // Very small minimum width
                            currentColumn.style.width = newWidth + 'px';
                            currentColumn.style.minWidth = newWidth + 'px';
                            currentColumn.style.maxWidth = newWidth + 'px';
                            
                            // Add expanded class to enable text wrapping
                            currentColumn.classList.add('expanded');
                            
                            // Update corresponding data cells in this column
                            const columnIndex = Array.from(currentColumn.parentNode.children).indexOf(currentColumn);
                            const table = currentColumn.closest('table');
                            const dataCells = table.querySelectorAll('tbody tr td:nth-child(' + (columnIndex + 1) + ')');
                            dataCells.forEach(cell => {
                                cell.style.width = newWidth + 'px';
                                cell.style.minWidth = newWidth + 'px';
                                cell.style.maxWidth = newWidth + 'px';
                                cell.classList.add('expanded');
                            });
                        }
                        e.preventDefault();
                    }
                    
                    // Row resizing
                    if (isRowResizing && currentRow) {
                        const deltaY = e.clientY - startY;
                        const newHeight = startHeight + deltaY;
                        
                        if (newHeight > 20) { // Minimum row height
                            currentRow.style.height = newHeight + 'px';
                            
                            // Update all cells in this row and add expanded class
                            const cells = currentRow.querySelectorAll('td');
                            cells.forEach(cell => {
                                cell.style.height = newHeight + 'px';
                                cell.style.maxHeight = newHeight + 'px';
                                cell.classList.add('expanded');
                            });
                        }
                        e.preventDefault();
                    }
                });

                document.addEventListener('mouseup', function(e) {
                    if (isResizing) {
                        console.log('Column resize ended');
                        isResizing = false;
                        if (currentColumn) {
                            currentColumn.classList.remove('resizing');
                        }
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        currentColumn = null;
                        currentHandle = null;
                    }
                    
                    if (isRowResizing) {
                        console.log('Row resize ended');
                        isRowResizing = false;
                        if (currentRow) {
                            currentRow.classList.remove('resizing');
                        }
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        currentRow = null;
                        currentRowHandle = null;
                    }
                });

                // Prevent text selection during resize
                document.addEventListener('selectstart', function(e) {
                    if (isResizing || isRowResizing) {
                        e.preventDefault();
                    }
                });
            }

            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM loaded, initializing resize functionality');
                initializeResizing();
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
        }
        .connection-info {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 12px;
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
            table-layout: auto;
        }
        th, td {
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            position: relative;
            min-width: 50px;
            border-right: 1px solid var(--vscode-panel-border);
            vertical-align: top;
            height: auto;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        th.expanded, td.expanded {
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: normal;
            overflow: visible;
        }
        th {
            background-color: var(--vscode-panel-background);
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
            user-select: none;
        }
        th.sortable {
            cursor: pointer;
            position: relative;
        }
        th.sortable:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .sort-indicator {
            position: absolute;
            right: 25px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        th.sort-asc .sort-indicator::after {
            content: '▲';
            color: var(--vscode-charts-blue);
        }
        th.sort-desc .sort-indicator::after {
            content: '▼';
            color: var(--vscode-charts-blue);
        }
        th.sortable:hover .sort-indicator::after {
            content: '↕';
            color: var(--vscode-foreground);
        }
        .resize-handle {
            position: absolute;
            top: 0;
            right: -2px;
            width: 8px;
            height: 100%;
            cursor: col-resize;
            background: transparent;
            border-right: 1px solid var(--vscode-panel-border);
            z-index: 20;
        }
        .resize-handle:hover {
            border-right: 2px solid var(--vscode-charts-blue);
            background: rgba(0, 122, 204, 0.1);
        }
        th.resizing {
            user-select: none;
            background-color: var(--vscode-list-hoverBackground);
        }
        .row-resize-handle {
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 8px;
            cursor: row-resize;
            background: transparent;
            border-bottom: 1px solid var(--vscode-panel-border);
            z-index: 20;
        }
        .row-resize-handle:hover {
            border-bottom: 2px solid var(--vscode-charts-blue);
            background: rgba(0, 122, 204, 0.1);
        }
        tr.resizing {
            background-color: var(--vscode-list-hoverBackground);
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
        .table-container {
            max-height: 60vh;
            overflow: auto;
            border: 1px solid var(--vscode-panel-border);
        }
        .error-container {
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            border: 1px solid var(--vscode-inputValidation-errorBorder);
        }
        .help-section {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 15px;
            margin-top: 20px;
            border-radius: 4px;
        }
    `;
}
//# sourceMappingURL=webviewManager.js.map