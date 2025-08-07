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
            
            /* Simple table styling like Kusto Explorer */
            table.dataTable {
                border-collapse: collapse;
                border: 1px solid #ccc;
            }
            
            table.dataTable thead th {
                background-color: #f0f0f0;
                color: #000;
                font-weight: bold;
                border: 1px solid #ccc;
                padding: 8px;
                text-align: left;
            }
            
            table.dataTable tbody td {
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 12px;
                background-color: #ffffff;
                color: #000;
                border: 1px solid #ccc;
                padding: 4px 8px;
                text-align: left;
            }
            
            table.dataTable tbody tr:hover {
                background-color: #e6f3ff;
            }
            
            table.dataTable tbody tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            table.dataTable tbody tr:nth-child(even):hover {
                background-color: #e6f3ff;
            }
            
            /* Cell selection styling like Kusto Explorer */
            table.dataTable tbody td.selected {
                background-color: #316AC5 !important;
                color: white !important;
            }
            
            /* Context menu styling */
            .context-menu {
                position: absolute;
                background: white;
                border: 1px solid #ccc;
                box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                min-width: 200px;
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
            
            .context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            }
            
            .context-menu-item:hover {
                background-color: #0078d4;
                color: white;
            }
            
            .context-menu-item:last-child {
                border-bottom: none;
            }
            
            /* Remove DataTables export buttons and other controls */
            .dt-buttons, .dataTables_filter, .dataTables_length {
                display: none;
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
            
            /* Cell detail panel styling */
            .cell-detail-panel {
                margin-top: 15px;
                background-color: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 15px;
                display: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .cell-detail-panel.visible {
                display: block;
            }
            
            .cell-detail-header {
                background-color: #f8f9fa;
                color: #495057;
                padding: 8px 12px;
                margin: -15px -15px 10px -15px;
                border-bottom: 1px solid #dee2e6;
                font-weight: 600;
                font-size: 14px;
                border-radius: 4px 4px 0 0;
            }
            
            .cell-detail-content {
                font-family: 'Cascadia Code', 'Courier New', monospace;
                font-size: 13px;
                color: #212529;
                background-color: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 3px;
                padding: 10px;
                white-space: pre-wrap;
                word-wrap: break-word;
                max-height: 300px;
                overflow-y: auto;
                line-height: 1.4;
            }
            
            .cell-detail-actions {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }
            
            .cell-detail-button {
                background-color: #0078d4;
                color: white;
                border: none;
                padding: 5px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            }
            
            .cell-detail-button:hover {
                background-color: #005a9e;
            }
            
            .cell-detail-button.secondary {
                background-color: #6c757d;
            }
            
            .cell-detail-button.secondary:hover {
                background-color: #545b62;
            }
            
            /* Table cell selection styling */
            table.dataTable tbody td.cell-selected {
                background-color: #e3f2fd !important;
                border: 2px solid #0066cc !important;
                box-shadow: inset 0 0 0 1px #0066cc;
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
            
            <!-- Cell Detail Panel -->
            <div id="cell-detail-panel" class="cell-detail-panel">
                <div class="cell-detail-header">
                    <span id="cell-detail-title">Cell Content Details</span>
                </div>
                <div class="cell-detail-content" id="cell-detail-content">
                    Click on any table cell to view its content here...
                </div>
                <div class="cell-detail-actions">
                    <button class="cell-detail-button" onclick="copyCellContent()">📋 Copy Content</button>
                    <button class="cell-detail-button secondary" onclick="closeCellDetail()">✕ Close</button>
                </div>
            </div>
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

        <!-- Context Menu for Copy Options -->
        <div id="context-menu" class="context-menu" style="display: none;">
            <div class="context-menu-item" onclick="copyWithHeaders()">Copy with headers</div>
            <div class="context-menu-item" onclick="copyAsHtml()">Copy as HTML</div>
            <div class="context-menu-item" onclick="copyAsDatabase()">Copy as database</div>
        </div>

        <script>
            let dataTable = null;
            let selectedCells = [];
            let contextMenu = null;
            
            // Original data for copy operations
            const originalColumns = ${JSON.stringify(results.columns)};
            const originalData = ${JSON.stringify(results.rows)};
            
            // Context menu functions (defined at top level for global access)
            function hideContextMenu() {
                const contextMenu = $('#context-menu');
                if (contextMenu.length) {
                    contextMenu.hide();
                }
            }
            
            function showContextMenu(x, y) {
                contextMenu = $('#context-menu');
                contextMenu.css({
                    display: 'block',
                    left: x + 'px',
                    top: y + 'px'
                });
            }
            
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
                
                // Initialize simple DataTable like Kusto Explorer
                try {
                    dataTable = $('#kusto-table').DataTable({
                        // Basic options
                        paging: true,
                        pageLength: 100,
                        lengthMenu: [[50, 100, 250, -1], [50, 100, 250, "All"]],
                        
                        // Searching
                        searching: true,
                        
                        // Sorting
                        ordering: true,
                        order: [], // Preserve Kusto's order
                        
                        // Scrolling
                        scrollX: true,
                        scrollY: '70vh',
                        scrollCollapse: true,
                        
                        // Simple configuration
                        processing: false,
                        serverSide: false,
                        
                        // Remove buttons and extra features
                        dom: 'lfrtip', // Simple layout without buttons
                        
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
                    
                    console.log('✅ DataTables initialized successfully');
                    
                    // Add cell selection like Kusto Explorer
                    let isSelecting = false;
                    let startCell = null;
                    let endCell = null;
                    
                    // Mouse events for cell selection
                    $('#kusto-table tbody').on('mousedown', 'td', function(e) {
                        if (e.which === 1) { // Left click
                            e.preventDefault();
                            isSelecting = true;
                            startCell = {row: $(this).parent().index(), col: $(this).index()};
                            endCell = startCell;
                            
                            // Clear previous selection
                            $('#kusto-table tbody td').removeClass('selected');
                            $(this).addClass('selected');
                            selectedCells = [this];
                        }
                    });
                    
                    $('#kusto-table tbody').on('mouseover', 'td', function() {
                        if (isSelecting) {
                            endCell = {row: $(this).parent().index(), col: $(this).index()};
                            updateSelection();
                        }
                    });
                    
                    $(document).on('mouseup', function() {
                        isSelecting = false;
                    });
                    
                    // Right-click context menu
                    $('#kusto-table tbody').on('contextmenu', 'td', function(e) {
                        e.preventDefault();
                        
                        // If cell not selected, select it
                        if (!$(this).hasClass('selected')) {
                            $('#kusto-table tbody td').removeClass('selected');
                            $(this).addClass('selected');
                            selectedCells = [this];
                        }
                        
                        // Show context menu
                        showContextMenu(e.pageX, e.pageY);
                    });
                    
                    // Hide context menu on click elsewhere
                    $(document).on('click', function() {
                        hideContextMenu();
                    });
                    
                    function updateSelection() {
                        $('#kusto-table tbody td').removeClass('selected');
                        selectedCells = [];
                        
                        const minRow = Math.min(startCell.row, endCell.row);
                        const maxRow = Math.max(startCell.row, endCell.row);
                        const minCol = Math.min(startCell.col, endCell.col);
                        const maxCol = Math.max(startCell.col, endCell.col);
                        
                        $('#kusto-table tbody tr').each(function(rowIndex) {
                            if (rowIndex >= minRow && rowIndex <= maxRow) {
                                $(this).find('td').each(function(colIndex) {
                                    if (colIndex >= minCol && colIndex <= maxCol) {
                                        $(this).addClass('selected');
                                        selectedCells.push(this);
                                    }
                                });
                            }
                        });
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to initialize DataTables:', error);
                    console.log('Falling back to basic table display');
                }
                
                // Context menu functions (outside try block for global access)
                function hideContextMenu() {
                    const contextMenu = $('#context-menu');
                    if (contextMenu.length) {
                        contextMenu.hide();
                    }
                }
            }
            
            // Context menu copy functions
            function copyWithHeaders() {
                hideContextMenu();
                
                if (selectedCells.length === 0) return;
                
                // Get selection bounds
                let minRow = Infinity, maxRow = -1, minCol = Infinity, maxCol = -1;
                selectedCells.forEach(cell => {
                    const row = $(cell).parent().index();
                    const col = $(cell).index();
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                });
                
                let copyText = '';
                const TAB = String.fromCharCode(9);
                const NEWLINE = String.fromCharCode(10);
                
                // Add headers from original data
                const headers = [];
                for (let i = minCol; i <= maxCol; i++) {
                    headers.push(originalColumns[i]);
                }
                copyText += headers.join(TAB) + NEWLINE;
                
                // Add data from original data
                for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
                    if (rowIndex < originalData.length) {
                        const rowData = [];
                        for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
                            if (colIndex < originalData[rowIndex].length) {
                                const cellValue = originalData[rowIndex][colIndex];
                                rowData.push(cellValue == null ? '' : cellValue.toString());
                            }
                        }
                        copyText += rowData.join(TAB) + NEWLINE;
                    }
                }
                
                navigator.clipboard.writeText(copyText.trim()).then(() => {
                    console.log('Copied with headers successfully');
                }).catch(err => {
                    console.error('Copy failed:', err);
                });
            }
            
            function copyAsHtml() {
                hideContextMenu();
                
                if (selectedCells.length === 0) return;
                
                // Get selection bounds
                let minRow = Infinity, maxRow = -1, minCol = Infinity, maxCol = -1;
                selectedCells.forEach(cell => {
                    const row = $(cell).parent().index();
                    const col = $(cell).index();
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                });
                
                // Create styled HTML table exactly like Azure Data Explorer
                let htmlText = '<style>' +
                    'table { border-collapse: collapse; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; width: auto; margin: 0; }' +
                    'th { background: linear-gradient(to bottom, #f8f8f8 0%, #e8e8e8 100%); border: 1px solid #d0d0d0; padding: 8px 12px; text-align: left; font-weight: 600; color: #333; white-space: nowrap; }' +
                    'td { border: 1px solid #d0d0d0; padding: 6px 12px; text-align: left; color: #333; background-color: white; white-space: nowrap; }' +
                    'tr:nth-child(even) td { background-color: #f9f9f9; }' +
                    'tr:hover td { background-color: #e3f2fd !important; }' +
                    'th:first-child, td:first-child { border-left: 2px solid #0078d4; }' +
                    'table { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
                    '</style>' +
                    '<table><thead><tr>';
                
                // Add headers from original data
                for (let i = minCol; i <= maxCol; i++) {
                    htmlText += '<th>' + escapeHtml(originalColumns[i]) + '</th>';
                }
                htmlText += '</tr></thead><tbody>';
                
                // Add data rows from original data
                for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
                    if (rowIndex < originalData.length) {
                        htmlText += '<tr>';
                        for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
                            if (colIndex < originalData[rowIndex].length) {
                                const cellValue = originalData[rowIndex][colIndex];
                                htmlText += '<td>' + escapeHtml(cellValue == null ? '' : cellValue.toString()) + '</td>';
                            }
                        }
                        htmlText += '</tr>';
                    }
                }
                htmlText += '</tbody></table>';
                
                // Create plain text version for fallback
                let plainText = '';
                const TAB = String.fromCharCode(9);
                const NEWLINE = String.fromCharCode(10);
                
                // Add headers
                const headers = [];
                for (let i = minCol; i <= maxCol; i++) {
                    headers.push(originalColumns[i]);
                }
                plainText += headers.join(TAB) + NEWLINE;
                
                // Add data
                for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
                    if (rowIndex < originalData.length) {
                        const rowData = [];
                        for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
                            if (colIndex < originalData[rowIndex].length) {
                                const cellValue = originalData[rowIndex][colIndex];
                                rowData.push(cellValue == null ? '' : cellValue.toString());
                            }
                        }
                        plainText += rowData.join(TAB) + NEWLINE;
                    }
                }
                
                // Use ClipboardItem to copy both HTML and plain text
                if (navigator.clipboard && navigator.clipboard.write) {
                    const clipboardItem = new ClipboardItem({
                        'text/html': new Blob([htmlText], { type: 'text/html' }),
                        'text/plain': new Blob([plainText.trim()], { type: 'text/plain' })
                    });
                    
                    navigator.clipboard.write([clipboardItem]).then(() => {
                        console.log('Copied as formatted table successfully');
                    }).catch(err => {
                        console.error('Rich copy failed, falling back to plain text:', err);
                        navigator.clipboard.writeText(plainText.trim());
                    });
                } else {
                    // Fallback to plain text
                    navigator.clipboard.writeText(plainText.trim()).then(() => {
                        console.log('Copied as plain text table');
                    }).catch(err => {
                        console.error('Copy failed:', err);
                    });
                }
            }
            
            // Helper function to escape HTML
            function escapeHtml(unsafe) {
                if (unsafe == null) return '';
                return unsafe.toString()
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }
            
            function copyAsDatabase() {
                hideContextMenu();
                
                if (selectedCells.length === 0) return;
                
                // Get selection bounds
                let minRow = Infinity, maxRow = -1, minCol = Infinity, maxCol = -1;
                selectedCells.forEach(cell => {
                    const row = $(cell).parent().index();
                    const col = $(cell).index();
                    minRow = Math.min(minRow, row);
                    maxRow = Math.max(maxRow, row);
                    minCol = Math.min(minCol, col);
                    maxCol = Math.max(maxCol, col);
                });
                
                let sqlText = '';
                
                // Add data in SQL format from original data
                for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
                    if (rowIndex < originalData.length) {
                        const rowData = [];
                        for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
                            if (colIndex < originalData[rowIndex].length) {
                                let value = originalData[rowIndex][colIndex];
                                if (value == null) {
                                    rowData.push('NULL');
                                } else if (typeof value === 'string') {
                                    // Escape single quotes and wrap strings in quotes
                                    value = "'" + value.replace(/'/g, "''") + "'";
                                    rowData.push(value);
                                } else {
                                    rowData.push(value.toString());
                                }
                            }
                        }
                        sqlText += '(' + rowData.join(', ') + ')';
                        if (rowIndex < maxRow) sqlText += ',' + String.fromCharCode(10);
                    }
                }
                
                navigator.clipboard.writeText(sqlText).then(() => {
                    console.log('Copied as database format successfully');
                }).catch(err => {
                    console.error('Copy failed:', err);
                });
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
            
            // Cell detail panel functions
            let currentCellContent = '';
            
            function showCellDetail(cellData, columnName, rowNumber, columnNumber) {
                const detailPanel = document.getElementById('cell-detail-panel');
                const detailTitle = document.getElementById('cell-detail-title');
                const detailContent = document.getElementById('cell-detail-content');
                
                // Store current content for copy functionality
                currentCellContent = cellData || '';
                
                // Format the display content
                let displayContent = cellData;
                if (cellData === null || cellData === undefined) {
                    displayContent = '[NULL]';
                } else if (cellData === '') {
                    displayContent = '[EMPTY STRING]';
                } else {
                    displayContent = cellData.toString();
                }
                
                // Update panel content
                detailTitle.textContent = columnName + ' (Row ' + rowNumber + ', Column ' + columnNumber + ')';
                detailContent.textContent = displayContent;
                
                // Show the panel with animation
                detailPanel.classList.add('visible');
                
                // Scroll to panel
                detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            function copyCellContent() {
                if (currentCellContent) {
                    navigator.clipboard.writeText(currentCellContent.toString()).then(function() {
                        // Visual feedback
                        const button = event.target;
                        const originalText = button.textContent;
                        button.textContent = '✅ Copied!';
                        button.style.backgroundColor = '#28a745';
                        
                        setTimeout(() => {
                            button.textContent = originalText;
                            button.style.backgroundColor = '#0078d4';
                        }, 1500);
                    }).catch(function() {
                        alert('Failed to copy content to clipboard');
                    });
                }
            }
            
            function closeCellDetail() {
                const detailPanel = document.getElementById('cell-detail-panel');
                detailPanel.classList.remove('visible');
                
                // Remove cell selection
                $('#kusto-table tbody td').removeClass('cell-selected');
                
                // Clear current content
                currentCellContent = '';
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