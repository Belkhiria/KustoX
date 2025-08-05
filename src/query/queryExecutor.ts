/**
 * Query execution utilities for Kusto
 */

import * as vscode from 'vscode';
import { KustoConnection, QueryResult, ParsedError } from '../types';
import { loadKustoSDK, getClientRequestProperties, generateUUID } from '../kusto/sdkManager';
import { processKustoResponse } from '../kusto/responseProcessor';
import { parseKustoError } from '../error/errorHandler';
import { showQueryResults, showQueryError } from '../webview/webviewManager';

export class QueryExecutor {
    constructor(private getConnection: () => KustoConnection | null) {}

    private cleanQuery(query: string): string {
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

    private parseMultipleQueries(queryText: string): Array<{query: string, name?: string}> {
        // Split queries by semicolon followed by optional whitespace
        const queries: Array<{query: string, name?: string}> = [];
        
        // First, clean the query text
        const cleanedText = this.cleanQuery(queryText);
        
        // Split by semicolon that's not inside quotes
        const parts = this.splitQueriesBySemicolon(cleanedText);
        
        for (let part of parts) {
            part = part.trim();
            if (!part) continue;
            
            // Check if query ends with "| as QueryName;"
            const asMatch = part.match(/^(.*?)\|\s*as\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?\s*$/is);
            if (asMatch) {
                queries.push({
                    query: asMatch[1].trim(),
                    name: asMatch[2].trim()
                });
            } else {
                // Regular query without alias
                queries.push({
                    query: part.replace(/;$/, '').trim()
                });
            }
        }
        
        return queries.filter(q => q.query.length > 0);
    }

    private splitQueriesBySemicolon(text: string): string[] {
        const queries: string[] = [];
        let current = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let i = 0;
        
        while (i < text.length) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
            } else if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
            } else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
                // Found a semicolon outside of quotes
                queries.push(current);
                current = '';
                i++;
                continue;
            }
            
            current += char;
            i++;
        }
        
        // Add the last query if there's remaining content
        if (current.trim()) {
            queries.push(current);
        }
        
        return queries;
    }

    async executeQuery(): Promise<void> {
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
            const configure = await vscode.window.showErrorMessage(
                'No Kusto connection configured. Would you like to configure one now?',
                'Configure Connection'
            );
            if (configure) {
                await vscode.commands.executeCommand('kustox.configureConnection');
                return;
            } else {
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

        // If only one query, execute it normally
        if (parsedQueries.length === 1) {
            const queryToExecute = parsedQueries[0].query;
            await this.executeSingleQuery(queryToExecute, parsedQueries[0].name);
            return;
        }

        // Multiple queries - execute them in parallel and show in tabbed view
        await this.executeMultipleQueries(parsedQueries);
    }

    private async executeSingleQuery(queryToExecute: string, queryName?: string): Promise<void> {
        const connection = this.getConnection()!; // We know it exists at this point
        
        // For debugging: Try to test connection first with a simple query
        if (queryToExecute.trim().toLowerCase() === 'debug connection') {
            try {
                console.log('🔧 Testing basic connection with minimal query...');
                const testResponse = await connection.client.execute(connection.database, 'print "test"');
                console.log('✅ Basic connection test successful:', testResponse);
                vscode.window.showInformationMessage('✅ Connection test successful!');
                return;
            } catch (testError) {
                console.error('❌ Basic connection test failed:', testError);
                vscode.window.showErrorMessage(`❌ Connection test failed: ${testError}`);
                return;
            }
        }

        // Initialize variables outside progress callback for error handling access
        const startTime = Date.now();
        const ClientRequestProperties = getClientRequestProperties();
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
                crp.setOption('clientRequestId', `KustoX-${generateUUID()}`);
                
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
                const response = await connection.client.execute(
                    connection.database, 
                    queryToExecute, 
                    crp
                );
                
                const executionTime = Date.now() - startTime;
                
                progress.report({ increment: 80, message: "Processing results..." });

                // Process the response using official patterns
                const results = processKustoResponse(response, executionTime);
                
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
                    vscode.window.showInformationMessage(
                        `🔍 Query${queryName ? ` (${queryName})` : ''} executed successfully but returned no results.\n\n` +
                        `This could mean:\n` +
                        `• Your query filters returned no matching data\n` +
                        `• The time range or conditions are too restrictive\n` +
                        `• The data doesn't exist in this database`,
                        'Show Empty Result View',
                        'Review Query'
                    ).then(choice => {
                        if (choice === 'Show Empty Result View') {
                            showQueryResults(queryToExecute, results, connection);
                        }
                    });
                    return;
                }
                
                // Show the results
                showQueryResults(queryToExecute, results, connection);

                progress.report({ increment: 100, message: "Query completed!" });
            });

        } catch (error) {
            // Enhanced error handling for detailed Kusto errors
            console.error('🚨 Full error object:', error);
            console.error('🚨 Error type:', typeof error);
            console.error('🚨 Error constructor:', error?.constructor?.name);
            console.error('🚨 Error message:', (error as any)?.message);
            console.error('🚨 Error string:', (error as any)?.toString());
            
            // Check if it's an axios error with response details
            const errorObj = error as any;
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
            
            let detailedError = parseKustoError(error);
            
            console.error('Query execution error:', error);
            console.error('Parsed error details:', detailedError);
            
            // Handle all errors the same way
            vscode.window.showErrorMessage(
                `Query${queryName ? ` (${queryName})` : ''} failed: ${detailedError.summary}`,
                'Show Error Details',
                'Try Again'
            ).then(selection => {
                if (selection === 'Show Error Details') {
                    showQueryError(queryToExecute, detailedError, connection);
                } else if (selection === 'Try Again') {
                    this.executeQuery();
                }
            });
        }
    }

    private async executeMultipleQueries(queries: Array<{query: string, name?: string}>): Promise<void> {
        const connection = this.getConnection()!;
        
        // Show initial progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Executing ${queries.length} Kusto Queries...`,
            cancellable: false
        }, async (progress) => {
            
            const queryResults: Array<{
                query: string;
                name?: string;
                result?: QueryResult;
                error?: ParsedError;
            }> = [];
            
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
                    const ClientRequestProperties = getClientRequestProperties();
                    const crp = new ClientRequestProperties();
                    
                    // Set up request properties
                    crp.setOption('clientRequestId', `KustoX-Multi-${i}-${generateUUID()}`);
                    crp.setTimeout(5 * 60 * 1000);
                    crp.setOption('application', 'KustoX-VSCode-Extension');
                    crp.setOption('version', '0.1.0');
                    
                    console.log(`🔍 Executing query ${i + 1}/${queries.length}: ${queryName}`);
                    
                    // Execute the query
                    const response = await connection.client.execute(
                        connection.database,
                        queryInfo.query,
                        crp
                    );
                    
                    const executionTime = Date.now() - startTime;
                    const results = processKustoResponse(response, executionTime);
                    
                    queryResults.push({
                        query: queryInfo.query,
                        name: queryInfo.name,
                        result: results
                    });
                    
                    console.log(`✅ Query ${i + 1} completed: ${results.rowCount} rows`);
                    
                } catch (error) {
                    console.error(`❌ Query ${i + 1} failed:`, error);
                    
                    const detailedError = parseKustoError(error);
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

    private showMultipleQueryResults(
        queryResults: Array<{query: string; name?: string; result?: QueryResult; error?: ParsedError}>,
        connection: KustoConnection
    ): void {
        // For now, create separate panels for each result instead of trying to call non-existent function
        queryResults.forEach((result, index) => {
            const tabTitle = result.name || `Query ${index + 1}`;
            
            if (result.error) {
                showQueryError(result.query, result.error, connection);
            } else if (result.result) {
                showQueryResults(result.query, result.result, connection);
            }
        });
    }
}
