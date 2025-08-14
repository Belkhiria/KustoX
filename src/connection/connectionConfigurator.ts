/**
 * Connection configuration utilities
 */

import * as vscode from 'vscode';
import { KustoConnection } from '../types';
import { loadKustoSDK, getKustoConnectionStringBuilder, getKustoClient } from '../kusto/sdkManager';

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

            // Get database name
            const database = await vscode.window.showInputBox({
                prompt: 'Enter database name',
                placeHolder: 'Samples',
                value: 'Samples' // Default to Samples database for general use
            });

            if (!database) {
                return;
            }

            // Authentication method selection
            const authMethod = await vscode.window.showQuickPick([
                {
                    label: '🌐 Interactive Browser (Recommended)',
                    detail: 'Browser authentication - works with ADX, Fabric, and any Azure AD account',
                    method: 'interactive'
                },
                {
                    label: '📱 Device Code Authentication',
                    detail: 'Device code authentication for headless environments',
                    method: 'device-code'
                },
                {
                    label: '⚡️ Azure CLI Authentication',
                    detail: 'Use Azure CLI credentials (optional az login)',
                    method: 'azurecli'
                },
                {
                    label: '🔑 Application Authentication',
                    detail: 'Use client ID and secret for service principal',
                    method: 'app'
                },
                {
                    label: '🎛️ Custom Client ID',
                    detail: 'Advanced: Use your own registered application client ID',
                    method: 'custom-client-id'
                },
                {
                    label: '🧪 Test Connection (No Auth)',
                    detail: 'Test basic connectivity without authentication (limited)',
                    method: 'test-only'
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

                const KustoConnectionStringBuilder = getKustoConnectionStringBuilder();
                const KustoClient = getKustoClient();
                let kcsb: any;

                switch (authMethod.method) {
                    case 'interactive':
                        // Simple browser authentication - just like Kusto Explorer
                        // Use withUserPrompt which automatically handles tenant detection for ADX, Fabric, etc.
                        kcsb = (KustoConnectionStringBuilder as any).withUserPrompt(clusterUrl);
                        break;
                        
                    case 'custom-client-id':
                        // Custom client ID authentication for user-registered applications
                        const customClientId = await vscode.window.showInputBox({
                            prompt: 'Enter your registered Application (Client) ID',
                            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                            validateInput: (value) => {
                                if (!value || value.trim() === '') {
                                    return 'Client ID is required';
                                }
                                // Basic GUID format validation
                                const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                if (!guidRegex.test(value.trim())) {
                                    return 'Invalid GUID format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
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
                        
                        kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl, 'common');
                        break;
                        
                    case 'device-code':
                        // Device code authentication - streamlined flow
                        kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl, 'common', (tokenResponse: any) => {
                            const message = `Device Code: ${tokenResponse.userCode}\n\nVisit: ${tokenResponse.verificationUrl}`;
                            
                            try {
                                // Validate URL before opening
                                if (tokenResponse.verificationUrl && typeof tokenResponse.verificationUrl === 'string') {
                                    let url = tokenResponse.verificationUrl;
                                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                        url = 'https://' + url;
                                    }
                                    const validUrl = new URL(url);
                                    
                                    vscode.window.showInformationMessage(
                                        message,
                                        'Open Browser', 'Copy Code'
                                    ).then(selection => {
                                        if (selection === 'Open Browser') {
                                            vscode.env.openExternal(vscode.Uri.parse(validUrl.toString()));
                                        } else if (selection === 'Copy Code') {
                                            vscode.env.clipboard.writeText(tokenResponse.userCode);
                                        }
                                    });
                                } else {
                                    vscode.window.showWarningMessage(
                                        `Code: ${tokenResponse.userCode} | URL: ${tokenResponse.verificationUrl}`,
                                        'Copy Code'
                                    );
                                }
                            } catch (error) {
                                console.error('URL validation error:', error);
                                vscode.window.showWarningMessage(
                                    `Code: ${tokenResponse.userCode} | URL: ${tokenResponse.verificationUrl}`,
                                    'Copy Code'
                                ).then(selection => {
                                    if (selection === 'Copy Code') {
                                        vscode.env.clipboard.writeText(tokenResponse.userCode);
                                    }
                                });
                            }
                        });
                        break;
                        
                    case 'azurecli':
                        // Azure CLI authentication - silent when credentials available
                        kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl, 'common');
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
                            vscode.window.showErrorMessage('All fields are required for application authentication');
                            return;
                        }

                        kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
                            clusterUrl, appClientId, clientSecret, tenantId
                        );
                        break;
                        
                    case 'test-only':
                        // Test connection without proper authentication (may fail for secured clusters)
                        vscode.window.showWarningMessage(
                            '⚠️ Testing without authentication. This may fail for secured clusters. Use this only for testing connectivity.',
                            'Continue'
                        );
                        
                        // Create a minimal connection string for testing
                        kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl, 'common');
                        break;
                        
                    default:
                        throw new Error('Invalid authentication method');
                }

                progress.report({ increment: 50, message: "Creating client..." });

                const client = new KustoClient(kcsb);
                
                progress.report({ increment: 80, message: "Testing connection..." });

                // Test the connection with a simple query with timeout
                
                const testResponse = await Promise.race([
                    client.execute(database, 'print "Connection test successful"'),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection test timeout after 30 seconds. This might be due to pending authentication. Please check if authentication is required in your browser.')), 30000)
                    )
                ]);
                
                
                progress.report({ increment: 100, message: "Connected!" });

                const connection: KustoConnection = {
                    client,
                    cluster: clusterUrl,
                    database,
                    alias: clusterAlias?.trim() || undefined
                };

                this.setConnection(connection);
                this.updateStatusCallback();

                vscode.window.showInformationMessage(`✅ Successfully connected to ${clusterUrl}/${database}`);
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Provide specific guidance for common authentication issues
            if (errorMessage.includes('timeout') || errorMessage.includes('pending authentication')) {
                vscode.window.showErrorMessage(
                    `❌ Connection timeout: ${errorMessage}\n\n` +
                    `This usually means authentication is pending. Please:\n` +
                    `1. Check if a browser window opened for authentication\n` +
                    `2. Complete the sign-in process if prompted\n` +
                    `3. Try the connection again after authentication`,
                    'Retry Connection'
                ).then(selection => {
                    if (selection === 'Retry Connection') {
                        this.configureConnection();
                    }
                });
            } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
                vscode.window.showErrorMessage(
                    `❌ Authentication failed: ${errorMessage}\n\n` +
                    `Please check:\n` +
                    `1. Your credentials are correct\n` +
                    `2. You have access to the cluster and database\n` +
                    `3. The authentication method is appropriate for your cluster`,
                    'Try Different Auth Method'
                ).then(selection => {
                    if (selection === 'Try Different Auth Method') {
                        this.configureConnection();
                    }
                });
            } else {
                vscode.window.showErrorMessage(`❌ Failed to connect to Kusto: ${errorMessage}`, 'Retry').then(selection => {
                    if (selection === 'Retry') {
                        this.configureConnection();
                    }
                });
            }
            console.error('Kusto connection error:', error);
        }
    }
}
