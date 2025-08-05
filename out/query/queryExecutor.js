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
    parseMultipleQueries(queryText) {
        // First, clean the query text
        const cleanedText = this.cleanQuery(queryText);
        console.log('🔍 Original query text:', queryText);
        console.log('🔍 Cleaned query text:', cleanedText);
        // More sophisticated detection for multiple queries
        // We need to distinguish between:
        // 1. Semicolons that are part of Kusto syntax (like after 'let' statements)
        // 2. Semicolons that actually separate different queries
        // Check for "| as QueryName;" pattern (this is a clear multiple query indicator)
        const hasAsQueryPattern = /\|\s*as\s+\w+\s*;/.test(cleanedText);
        // Check for semicolons that might separate queries, but exclude common Kusto syntax
        // We need to be very careful here - only detect true query separators
        // Look for patterns that indicate genuinely separate queries, not internal Kusto syntax
        // Pattern: semicolon followed by newline and a table name that's NOT preceded by 'let'
        // This excludes "let x = 10;\nTableName" but catches "Query1;\nTableName"
        const lines = cleanedText.split('\n');
        let hasSemicolonSeparatedQueries = false;
        for (let i = 0; i < lines.length - 1; i++) {
            const currentLine = lines[i].trim();
            const nextLine = lines[i + 1].trim();
            // Check if current line ends with semicolon
            if (currentLine.endsWith(';')) {
                // Check if the line with semicolon is NOT a 'let' statement
                const isLetStatement = /^\s*let\s+\w+\s*=/.test(currentLine);
                // Check if next line starts with what looks like a new query
                const nextLineStartsQuery = /^\w+\s*(\||$)/.test(nextLine) || /^print\s+/.test(nextLine);
                if (!isLetStatement && nextLineStartsQuery) {
                    hasSemicolonSeparatedQueries = true;
                    break;
                }
            }
        }
        const hasMultipleQueries = hasAsQueryPattern || hasSemicolonSeparatedQueries;
        console.log('🔍 Multiple query detection patterns:');
        console.log('  Pattern 1 ("| as Name;"):', hasAsQueryPattern);
        console.log('  Pattern 2 (semicolon separated queries):', hasSemicolonSeparatedQueries);
        console.log('  Treating as multiple queries:', hasMultipleQueries);
        if (!hasMultipleQueries) {
            // Single query - return as is
            console.log('📄 Detected as single query, returning as-is');
            return [{
                    query: cleanedText
                }];
        }
        // Multiple queries detected - split by semicolon that's not inside quotes
        console.log('📄 Detected as multiple queries, splitting...');
        const parts = this.splitQueriesBySemicolon(cleanedText);
        console.log('🔍 Split into', parts.length, 'parts');
        const queries = [];
        // In Kusto multiple query syntax, let statements at the beginning are shared
        // We need to identify let statements and prepend them to each actual query
        let letStatements = '';
        let actualQueries = [];
        console.log('🔍 Processing each part to identify let statements vs actual queries...');
        for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            let part = parts[partIndex].trim();
            if (!part)
                continue;
            console.log(`🔍 Processing part ${partIndex + 1}:`);
            console.log('─'.repeat(40));
            console.log(part);
            console.log('─'.repeat(40));
            // Check if this part contains only let statements
            const lines = part.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const isOnlyLetStatements = lines.every(line => line.startsWith('let ') ||
                line.startsWith('//') ||
                line === '' ||
                line.endsWith(';') && line.indexOf('|') === -1 && line.indexOf('print') === -1);
            console.log(`🔍 Part ${partIndex + 1} analysis:`);
            console.log(`  Lines: ${lines.length}`);
            console.log(`  Lines content: ${JSON.stringify(lines)}`);
            console.log(`  Is only let statements: ${isOnlyLetStatements}`);
            if (isOnlyLetStatements) {
                // This part contains only let statements - save them to prepend to actual queries
                letStatements = part;
                console.log('🔧 Found let statements part:', letStatements);
            }
            else {
                // This is an actual query
                console.log('🔧 Found actual query part');
                actualQueries.push(part);
            }
        }
        console.log('🔍 Final categorization:');
        console.log(`  Let statements: "${letStatements}"`);
        console.log(`  Actual queries: ${actualQueries.length} queries`);
        actualQueries.forEach((query, index) => {
            console.log(`    Query ${index + 1}: "${query.substring(0, 50)}..."`);
        });
        // Process each actual query
        for (let queryPart of actualQueries) {
            queryPart = queryPart.trim();
            if (!queryPart)
                continue;
            // Check if query ends with "| as QueryName"
            const asMatch = queryPart.match(/^(.*?)\|\s*as\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?\s*$/is);
            if (asMatch) {
                // Extract the actual query (without the "| as QueryName" part)
                const actualQuery = asMatch[1].trim();
                const queryName = asMatch[2].trim();
                const fullQuery = letStatements ? (letStatements + '\n\n' + actualQuery) : actualQuery;
                queries.push({
                    query: fullQuery,
                    name: queryName
                });
                console.log(`🔧 Extracted query "${queryName}" without "| as" syntax`);
            }
            else {
                // Regular query without alias
                const cleanQuery = queryPart.replace(/;$/, '').trim();
                const fullQuery = letStatements ? (letStatements + '\n\n' + cleanQuery) : cleanQuery;
                queries.push({
                    query: fullQuery
                });
            }
        }
        const filteredQueries = queries.filter(q => q.query.length > 0);
        console.log('🔍 Final parsed queries:', filteredQueries.map(q => ({ name: q.name, queryLength: q.query.length, preview: q.query.substring(0, 50) + '...' })));
        return filteredQueries;
    }
    splitQueriesBySemicolon(text) {
        console.log('🔧 splitQueriesBySemicolon called with text:');
        console.log('─'.repeat(80));
        console.log(text);
        console.log('─'.repeat(80));
        // For Kusto multiple query syntax, we need to be smarter about splitting
        // We should only split on semicolons that are actual query separators,
        // not on semicolons that are part of let statements or other Kusto syntax
        const queries = [];
        let current = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let i = 0;
        console.log('🔍 Starting character-by-character parsing...');
        while (i < text.length) {
            const char = text[i];
            // Debug quote state changes
            const wasInSingleQuote = inSingleQuote;
            const wasInDoubleQuote = inDoubleQuote;
            if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                console.log(`🔍 Position ${i}: Found single quote '${char}' - single quote state: ${wasInSingleQuote} → ${inSingleQuote}`);
                current += char; // Add the quote to the current string
            }
            else if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                console.log(`🔍 Position ${i}: Found double quote '${char}' - double quote state: ${wasInDoubleQuote} → ${inDoubleQuote}`);
                current += char; // Add the quote to the current string
            }
            else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
                // Found a semicolon outside of quotes - but we need to check if it's a query separator
                console.log(`🔍 Position ${i}: Found semicolon outside quotes - checking if it's a query separator`);
                // Look ahead to see what comes after this semicolon
                let nextNonWhitespaceIndex = i + 1;
                while (nextNonWhitespaceIndex < text.length && /\s/.test(text[nextNonWhitespaceIndex])) {
                    nextNonWhitespaceIndex++;
                }
                const remainingText = text.substring(nextNonWhitespaceIndex);
                console.log(`🔍 Text after semicolon: "${remainingText.substring(0, 50)}..."`);
                // Check if this semicolon is followed by a new query (not a let statement)
                // A new query typically starts with a table name or 'print', not 'let'
                const isQuerySeparator = /^((?!let\s)\w+\s*\||\w+\s*$|print\s)/i.test(remainingText);
                console.log(`🔍 Is query separator: ${isQuerySeparator}`);
                if (isQuerySeparator) {
                    // This is a genuine query separator
                    const currentQuery = current + char;
                    console.log(`✂️ SPLITTING: Adding query part: "${currentQuery.substring(0, 100)}${currentQuery.length > 100 ? '...' : ''}"`);
                    queries.push(currentQuery); // Include the semicolon in the query
                    current = '';
                    i++;
                    continue;
                }
                else {
                    // This is just a semicolon in Kusto syntax (like after a let statement)
                    // Include it in the current query and continue
                    console.log(`🔍 Not a query separator - including semicolon in current query`);
                    current += char;
                }
            }
            else {
                // Regular character - just add to current
                if (char === ';') {
                    console.log(`🔍 Position ${i}: Semicolon inside quotes (single: ${inSingleQuote}, double: ${inDoubleQuote}) - NOT splitting`);
                }
                current += char;
            }
            i++;
        }
        // Add the last query if there's remaining content
        if (current.trim()) {
            console.log(`📝 Adding final query part: "${current.substring(0, 100)}${current.length > 100 ? '...' : ''}"`);
            queries.push(current);
        }
        console.log('🔧 splitQueriesBySemicolon result - found', queries.length, 'parts:');
        queries.forEach((query, index) => {
            console.log(`📋 Part ${index + 1}:`);
            console.log('─'.repeat(60));
            console.log(query);
            console.log('─'.repeat(60));
        });
        return queries;
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
        // Parse multiple queries
        const parsedQueries = this.parseMultipleQueries(query);
        if (parsedQueries.length === 0) {
            vscode.window.showErrorMessage('No executable query found. Please write a Kusto query (non-comment lines).');
            return;
        }
        console.log(`Found ${parsedQueries.length} queries to execute:`, parsedQueries.map(q => ({ name: q.name, queryLength: q.query.length })));
        // Debug: Log each parsed query in detail
        parsedQueries.forEach((q, i) => {
            console.log(`\n🔍 PARSED QUERY ${i + 1} (Name: ${q.name || 'Unnamed'}):`);
            console.log('─'.repeat(50));
            console.log(q.query);
            console.log('─'.repeat(50));
        });
        // If only one query, execute it normally
        if (parsedQueries.length === 1) {
            console.log('📄 Executing single query');
            const queryToExecute = parsedQueries[0].query;
            await this.executeSingleQuery(queryToExecute, parsedQueries[0].name);
            return;
        }
        // Multiple queries - execute them sequentially and show in separate tabs
        console.log('📄 Executing multiple queries');
        await this.executeMultipleQueries(parsedQueries);
    }
    async executeSingleQuery(queryToExecute, queryName) {
        const connection = this.getConnection(); // We know it exists at this point
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
                title: `Executing Kusto Query${queryName ? ` (${queryName})` : ''}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                // Create client request properties following official documentation
                // Set a custom client request identifier
                crp.setOption('clientRequestId', `KustoX-${(0, sdkManager_1.generateUUID)()}`);
                // Add application context
                crp.setOption('application', 'KustoX-VSCode-Extension');
                crp.setOption('version', '0.1.0');
                progress.report({ increment: 30, message: "Sending query to cluster..." });
                // Debug: Log what we're about to send
                console.log('🔍 Debug - About to execute query:');
                console.log('  Cluster:', connection.cluster);
                console.log('  Database:', connection.database);
                console.log('  Query length:', queryToExecute.length);
                console.log('  Client request ID:', crp.getOption('clientRequestId'));
                console.log('🔍 FULL QUERY BEING SENT TO KUSTO:');
                console.log('─'.repeat(60));
                console.log(queryToExecute);
                console.log('─'.repeat(60));
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
                    vscode.window.showInformationMessage(`🔍 Query${queryName ? ` (${queryName})` : ''} executed successfully but returned no results.\n\n` +
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
            vscode.window.showErrorMessage(`Query${queryName ? ` (${queryName})` : ''} failed: ${detailedError.summary}`, 'Show Error Details', 'Try Again').then(selection => {
                if (selection === 'Show Error Details') {
                    (0, webviewManager_1.showQueryError)(queryToExecute, detailedError, connection);
                }
                else if (selection === 'Try Again') {
                    this.executeQuery();
                }
            });
        }
    }
    async executeMultipleQueries(queries) {
        const connection = this.getConnection();
        // Show initial progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Executing ${queries.length} Kusto Queries...`,
            cancellable: false
        }, async (progress) => {
            const queryResults = [];
            const progressIncrement = 100 / queries.length;
            // Execute queries sequentially to avoid overloading the cluster
            for (let i = 0; i < queries.length; i++) {
                const queryInfo = queries[i];
                const queryName = queryInfo.name || `Query ${i + 1}`;
                progress.report({
                    increment: 0,
                    message: `Executing ${queryName}...`
                });
                try {
                    const startTime = Date.now();
                    const ClientRequestProperties = (0, sdkManager_1.getClientRequestProperties)();
                    const crp = new ClientRequestProperties();
                    // Set up request properties
                    crp.setOption('clientRequestId', `KustoX-Multi-${i}-${(0, sdkManager_1.generateUUID)()}`);
                    crp.setOption('application', 'KustoX-VSCode-Extension');
                    crp.setOption('version', '0.1.0');
                    console.log(`🔍 Executing query ${i + 1}/${queries.length}: ${queryName}`);
                    console.log('🔍 FULL QUERY BEING SENT TO KUSTO:');
                    console.log('─'.repeat(60));
                    console.log(queryInfo.query);
                    console.log('─'.repeat(60));
                    // Execute the query
                    const response = await connection.client.execute(connection.database, queryInfo.query, crp);
                    const executionTime = Date.now() - startTime;
                    const results = (0, responseProcessor_1.processKustoResponse)(response, executionTime);
                    queryResults.push({
                        query: queryInfo.query,
                        name: queryInfo.name,
                        result: results
                    });
                    console.log(`✅ Query ${i + 1} completed: ${results.rowCount} rows`);
                }
                catch (error) {
                    console.error(`❌ Query ${i + 1} failed:`, error);
                    const detailedError = (0, errorHandler_1.parseKustoError)(error);
                    queryResults.push({
                        query: queryInfo.query,
                        name: queryInfo.name,
                        error: detailedError
                    });
                }
                progress.report({ increment: progressIncrement });
            }
            // Show all results in a tabbed interface
            progress.report({ message: "Displaying results..." });
            this.showMultipleQueryResults(queryResults, connection);
        });
    }
    showMultipleQueryResults(queryResults, connection) {
        // For now, create separate panels for each result instead of trying to call non-existent function
        queryResults.forEach((result, index) => {
            const tabTitle = result.name || `Query ${index + 1}`;
            if (result.error) {
                (0, webviewManager_1.showQueryError)(result.query, result.error, connection);
            }
            else if (result.result) {
                (0, webviewManager_1.showQueryResults)(result.query, result.result, connection);
            }
        });
    }
}
exports.QueryExecutor = QueryExecutor;
//# sourceMappingURL=queryExecutor.js.map