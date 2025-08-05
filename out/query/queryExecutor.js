"use strict";
/**
 * Query execution utilities for Kusto
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
exports.QueryExecutor = void 0;
const vscode = __importStar(require("vscode"));
const sdkManager_1 = require("../kusto/sdkManager");
const responseProcessor_1 = require("../kusto/responseProcessor");
const errorHandler_1 = require("../error/errorHandler");
const webviewManager_1 = require("../webview/webviewManager");
class QueryExecutor {
    constructor(getConnection) {
        this.getConnection = getConnection;
    }
    cleanQuery(query) {
        const lines = query.split('\n');
        const cleanLines = lines
            .map(line => line.trimRight()) // Remove trailing whitespace but preserve leading whitespace for formatting
            .filter(line => {
            const trimmedLine = line.trim();
            // Keep the line if it's not empty and doesn't start with //
            return trimmedLine.length > 0 && !trimmedLine.startsWith('//');
        });
        return cleanLines.join('\n').trim();
    }
    async executeQuery() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open a Kusto (.kql) file.');
            return;
        }
        if (editor.document.languageId !== 'kusto') {
            vscode.window.showErrorMessage('Please open a Kusto (.kql) file to execute queries.');
            return;
        }
        const connection = this.getConnection();
        if (!connection) {
            const configure = await vscode.window.showErrorMessage('No Kusto connection configured. Would you like to configure one now?', 'Configure Connection');
            if (configure) {
                await vscode.commands.executeCommand('kustox.configureConnection');
                return;
            }
            else {
                return;
            }
        }
        // Validate connection details
        console.log('🔍 Kusto connection details:', {
            cluster: connection.cluster,
            database: connection.database,
            hasClient: !!connection.client,
            clientType: connection.client?.constructor?.name
        });
        // Test connection configuration
        if (!connection.cluster || !connection.database) {
            vscode.window.showErrorMessage('Invalid connection configuration. Please reconnect to your Kusto cluster.');
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
        // Clean the query (remove only comment lines and empty lines, preserve all other content)
        const cleanQuery = this.cleanQuery(query);
        if (!cleanQuery.trim()) {
            vscode.window.showErrorMessage('No executable query found. Please write a Kusto query (non-comment lines).');
            return;
        }
        console.log('Executing query:', cleanQuery);
        // Use the original query without any modifications
        const queryToExecute = cleanQuery;
        // For debugging: Try to test connection first with a simple query
        if (queryToExecute.trim().toLowerCase() === 'debug connection') {
            try {
                console.log('🔧 Testing basic connection with minimal query...');
                const testResponse = await connection.client.execute(connection.database, 'print "test"');
                console.log('✅ Basic connection test successful:', testResponse);
                vscode.window.showInformationMessage('✅ Connection test successful!');
                return;
            }
            catch (testError) {
                console.error('❌ Basic connection test failed:', testError);
                vscode.window.showErrorMessage(`❌ Connection test failed: ${testError}`);
                return;
            }
        }
        // Initialize variables outside progress callback for error handling access
        const startTime = Date.now();
        const ClientRequestProperties = (0, sdkManager_1.getClientRequestProperties)();
        const crp = new ClientRequestProperties();
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Executing Kusto Query...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                // Create client request properties following official documentation
                // Set a custom client request identifier
                crp.setOption('clientRequestId', `KustoX-${(0, sdkManager_1.generateUUID)()}`);
                // Set the query timeout to 5 minutes
                crp.setTimeout(5 * 60 * 1000);
                // Add application context
                crp.setOption('application', 'KustoX-VSCode-Extension');
                crp.setOption('version', '0.1.0');
                progress.report({ increment: 30, message: "Sending query to cluster..." });
                // Debug: Log what we're about to send
                console.log('🔍 Debug - About to execute query:');
                console.log('  Cluster:', connection.cluster);
                console.log('  Database:', connection.database);
                console.log('  Query length:', queryToExecute.length);
                console.log('  Query preview:', queryToExecute.substring(0, 200) + (queryToExecute.length > 200 ? '...' : ''));
                console.log('  Client request ID:', crp.getOption('clientRequestId'));
                console.log('  Timeout:', crp.getTimeout());
                // Execute query with client request properties
                const response = await connection.client.execute(connection.database, queryToExecute, crp);
                const executionTime = Date.now() - startTime;
                progress.report({ increment: 80, message: "Processing results..." });
                // Process the response using official patterns
                const results = (0, responseProcessor_1.processKustoResponse)(response, executionTime);
                // Add detailed debugging for blank results
                console.log('🔍 Query execution results:');
                console.log('  Row count:', results.rowCount);
                console.log('  Has data:', results.hasData);
                console.log('  Columns:', results.columns.length);
                console.log('  Response type:', typeof response);
                console.log('  Response keys:', response ? Object.keys(response) : 'null');
                if (!results.hasData || results.rowCount === 0) {
                    console.log('⚠️ No data returned from query');
                    console.log('  Raw response:', JSON.stringify(response, null, 2).substring(0, 1000));
                    // Show a message to user about no results
                    vscode.window.showInformationMessage(`🔍 Query executed successfully but returned no results.\n\n` +
                        `This could mean:\n` +
                        `• Your query filters returned no matching data\n` +
                        `• The time range or conditions are too restrictive\n` +
                        `• The data doesn't exist in this database`, 'Show Empty Result View', 'Review Query').then(choice => {
                        if (choice === 'Show Empty Result View') {
                            (0, webviewManager_1.showQueryResults)(queryToExecute, results, connection);
                        }
                    });
                    return;
                }
                // Show the results
                (0, webviewManager_1.showQueryResults)(queryToExecute, results, connection);
                progress.report({ increment: 100, message: "Query completed!" });
            });
        }
        catch (error) {
            // Enhanced error handling for detailed Kusto errors
            console.error('🚨 Full error object:', error);
            console.error('🚨 Error type:', typeof error);
            console.error('🚨 Error constructor:', error?.constructor?.name);
            console.error('🚨 Error message:', error?.message);
            console.error('🚨 Error string:', error?.toString());
            // Check if it's an axios error with response details
            const errorObj = error;
            if (errorObj.response) {
                console.error('🚨 Response status:', errorObj.response.status);
                console.error('🚨 Response headers:', errorObj.response.headers);
                console.error('🚨 Response data:', errorObj.response.data);
                console.error('🚨 Response data (stringified):', JSON.stringify(errorObj.response.data, null, 2));
            }
            if (errorObj.config) {
                console.error('🚨 Request config URL:', errorObj.config.url);
                console.error('🚨 Request config method:', errorObj.config.method);
                console.error('🚨 Request config headers:', errorObj.config.headers);
            }
            let detailedError = (0, errorHandler_1.parseKustoError)(error);
            console.error('Query execution error:', error);
            console.error('Parsed error details:', detailedError);
            // Handle all errors the same way
            vscode.window.showErrorMessage(`Query failed: ${detailedError.summary}`, 'Show Error Details', 'Try Again').then(selection => {
                if (selection === 'Show Error Details') {
                    (0, webviewManager_1.showQueryError)(queryToExecute, detailedError, connection);
                }
                else if (selection === 'Try Again') {
                    this.executeQuery();
                }
            });
        }
    }
}
exports.QueryExecutor = QueryExecutor;
//# sourceMappingURL=queryExecutor.js.map