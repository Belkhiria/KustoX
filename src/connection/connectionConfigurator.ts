/**
 * Connection configuration utilities
 */

import * as vscode from 'vscode';
import { KustoConnection } from '../types';
import { loadKustoSDK, getKustoConnectionStringBuilder, getKustoClient } from '../kusto/sdkManager';
import { AuthenticationManager } from '../kusto/authenticationManager';

export class ConnectionConfigurator {
    constructor(
        private setConnection: (connection: KustoConnection) => void,
        private updateStatusCallback: () => void
    ) {}

    async configureConnection(): Promise<void> {
        try {
            // Ensure Kusto SDK is loaded
            await loadKustoSDK();

            // Get cluster URL
            const clusterUrl = await vscode.window.showInputBox({
                prompt: 'Enter Kusto cluster URL (e.g., https://help.kusto.windows.net)',
                placeHolder: 'https://your-cluster.kusto.windows.net',
                value: 'https://help.kusto.windows.net', // Default to help cluster for general use
                validateInput: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Cluster URL is required';
                    }
                    if (!value.startsWith('https://')) {
                        return 'Cluster URL must start with https://';
                    }
                    // Basic URL validation
                    try {
                        new URL(value);
                        return null;
                    } catch {
                        return 'Invalid URL format';
                    }
                }
            });

            if (!clusterUrl) {
                return;
            }

            // Get optional alias/display name for the cluster
            const clusterAlias = await vscode.window.showInputBox({
                prompt: 'Enter a display name for this cluster (optional)',
                placeHolder: 'e.g., "Production", "Help Cluster", "Analytics DB"',
                validateInput: (value) => {
                    // Alias is optional, so empty is allowed
                    if (value && value.trim().length > 50) {
                        return 'Display name should be 50 characters or less';
                    }
                    return null;
                }
            });

            // Get database name/ID - handle both regular ADX and Fabric Eventhouse formats
            const isFabricCluster = clusterUrl.includes('fabric.microsoft.com');
            
            let database: string | undefined;
            
            if (isFabricCluster) {
                // For Fabric, offer to auto-detect or manual entry
                const fabricDbChoice = await vscode.window.showQuickPick([
                    {
                        label: '🔍 Auto-detect Database',
                        detail: 'Connect and show available databases to choose from',
                        method: 'auto-detect'
                    },
                    {
                        label: '✏️ Enter Database ID Manually',
                        detail: 'Enter the GUID database ID (e.g., b3ecde0f-93e1-446d-9b3f-c1ce9a34024f)',
                        method: 'manual'
                    }
                ], {
                    placeHolder: 'How would you like to specify the Fabric Eventhouse database?'
                });

                if (!fabricDbChoice) {
                    return;
                }

                if (fabricDbChoice.method === 'manual') {
                    database = await vscode.window.showInputBox({
                        prompt: 'Enter Fabric Eventhouse database ID (GUID)',
                        placeHolder: 'b3ecde0f-93e1-446d-9b3f-c1ce9a34024f',
                        validateInput: (value) => {
                            if (!value || value.trim() === '') {
                                return 'Database ID is required';
                            }
                            const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            if (!guidRegex.test(value.trim())) {
                                return 'Please enter a valid GUID format (e.g., b3ecde0f-93e1-446d-9b3f-c1ce9a34024f)';
                            }
                            return null;
                        }
                    });
                } else {
                    // Auto-detect will be handled after authentication
                    database = 'auto-detect';
                }
            } else {
                // Regular ADX cluster
                database = await vscode.window.showInputBox({
                    prompt: 'Enter database name',
                    placeHolder: 'Samples',
                    validateInput: (value) => {
                        if (!value || value.trim() === '') {
                            return 'Database name is required';
                        }
                        return null;
                    }
                });
            }

            if (!database) {
                return;
            }

            // Unified authentication for AAD with MFA support
            // This handles both ADX and Fabric Eventhouse automatically
            const authResult = await AuthenticationManager.getUnifiedAuthentication(clusterUrl);
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Authenticating with ${authResult.displayName}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 30, message: "Creating client..." });

                const KustoClient = getKustoClient();
                const client = new KustoClient(authResult.connectionStringBuilder);
                
                progress.report({ increment: 60, message: "Testing connection..." });

                // Handle auto-detection for Fabric Eventhouse
                let finalDatabase: string = database || '';
                if (database === 'auto-detect') {
                    progress.report({ message: "Auto-detecting Fabric databases..." });
                    
                    try {
                        // Try to get list of databases
                        const dbListResponse = await client.execute('', '.show databases');
                        const databases: any[] = [];
                        
                        // Process the response to extract database names/IDs
                        if (dbListResponse && dbListResponse.primaryResults && dbListResponse.primaryResults[0]) {
                            const dbTable = dbListResponse.primaryResults[0];
                            for (const row of dbTable.data) {
                                if (row.DatabaseName) {
                                    databases.push({
                                        label: row.DatabaseName,
                                        detail: `ID: ${row.DatabaseName}`,
                                        id: row.DatabaseName
                                    });
                                }
                            }
                        }
                        
                        if (databases.length === 0) {
                            throw new Error('No databases found or insufficient permissions');
                        }
                        
                        // Let user choose from available databases
                        const selectedDb = await vscode.window.showQuickPick(databases, {
                            placeHolder: 'Select a database from your Fabric Eventhouse'
                        });
                        
                        if (!selectedDb) {
                            vscode.window.showErrorMessage('No database selected. Connection cancelled.');
                            return;
                        }
                        
                        finalDatabase = selectedDb.id;
                        
                    } catch (dbError) {
                        vscode.window.showErrorMessage(
                            'Could not auto-detect databases. Please enter the database ID manually.',
                            'Retry with Manual Entry'
                        );
                        return;
                    }
                }

                // Validate authentication and connection
                progress.report({ increment: 90, message: "Validating authentication..." });
                
                const isValid = await AuthenticationManager.validateAuthentication(client, finalDatabase);
                if (!isValid) {
                    throw new Error('Authentication validation failed - unable to execute test query');
                }
                
                progress.report({ increment: 100, message: "Connected!" });

                const connection: KustoConnection = {
                    client,
                    cluster: clusterUrl,
                    database: finalDatabase,
                    alias: clusterAlias?.trim() || undefined
                };

                this.setConnection(connection);
                this.updateStatusCallback();

                vscode.window.showInformationMessage(
                    `✅ Successfully connected to ${clusterUrl}/${finalDatabase}\n` +
                    `Authentication: ${authResult.displayName}`
                );
            });

        } catch (error) {
            // Use the unified authentication error handler
            AuthenticationManager.handleAuthenticationError(error, () => this.configureConnection());
            console.error('Kusto connection error:', error);
        }
    }
}
