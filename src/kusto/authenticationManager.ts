/**
 * Unified Authentication Manager for Azure Data Explorer and Fabric Eventhouse
 * Supports AAD with MFA using modern authentication patterns
 */

import * as vscode from 'vscode';
import { getKustoConnectionStringBuilder } from './sdkManager';

export interface AuthenticationResult {
    connectionStringBuilder: any;
    authMethod: string;
    displayName: string;
}

export class AuthenticationManager {
    
    /**
     * Get unified authentication for ADX and Fabric with AAD and MFA support
     * This is the single method that should be used for all authentication scenarios
     */
    static async getUnifiedAuthentication(clusterUrl: string): Promise<AuthenticationResult> {
        const KustoConnectionStringBuilder = getKustoConnectionStringBuilder();
        
        // Validate that we have the connection string builder
        if (!KustoConnectionStringBuilder) {
            throw new Error('Kusto SDK not properly loaded. Please try reloading the extension.');
        }
        
        // Check if silent mode is enabled
        const config = vscode.workspace.getConfiguration('kustox');
        const silentMode = config.get<boolean>('auth.silentMode', false);
        
        // For modern AAD authentication with MFA support, use withUserPrompt
        // This method automatically handles:
        // - AAD Multi-Factor Authentication (MFA)
        // - Both regular ADX and Fabric Eventhouse
        // - Token caching and refresh
        // - Tenant discovery
        // - Device-based authentication when needed
        
        let kcsb: any;
        let authMethod: string;
        let displayName: string;
        
        if (silentMode) {
            // Silent authentication - use withUserPrompt which handles caching automatically
            try {
                kcsb = KustoConnectionStringBuilder.withUserPrompt(clusterUrl);
                authMethod = 'silent-browser';
                displayName = 'Silent Browser Authentication';
            } catch (error) {
                console.warn('Silent authentication failed, falling back to device auth:', error);
                // Fallback to device authentication for silent mode
                kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl, 'common');
                authMethod = 'silent-device';
                displayName = 'Silent Device Authentication';
            }
        } else {
            // Interactive authentication with user choice
            const authChoice = await vscode.window.showQuickPick([
                {
                    label: '🌐 Interactive Browser (Recommended)',
                    detail: 'Modern AAD authentication with MFA support - works with ADX, Fabric, and all Azure AD scenarios',
                    method: 'interactive',
                    kcsb: () => KustoConnectionStringBuilder.withUserPrompt(clusterUrl)
                },
                {
                    label: '📱 Device Code Authentication',
                    detail: 'Alternative authentication for restricted environments or when browser auth fails',
                    method: 'device-code',
                    kcsb: () => this.createDeviceCodeAuth(clusterUrl, KustoConnectionStringBuilder)
                },
                {
                    label: '🔑 Service Principal (App Registration)',
                    detail: 'Automated authentication using registered application credentials',
                    method: 'service-principal',
                    kcsb: () => this.createServicePrincipalAuth(clusterUrl, KustoConnectionStringBuilder)
                }
            ], {
                placeHolder: 'Select authentication method for Azure Data Explorer/Fabric'
            });
            
            if (!authChoice) {
                throw new Error('Authentication method selection cancelled');
            }
            
            kcsb = await authChoice.kcsb();
            authMethod = authChoice.method;
            displayName = authChoice.label.replace(/^[🌐📱🔑]\s*/, ''); // Remove emoji prefix
        }
        
        return {
            connectionStringBuilder: kcsb,
            authMethod,
            displayName
        };
    }
    
    /**
     * Create device code authentication with proper UI handling
     */
    private static async createDeviceCodeAuth(clusterUrl: string, KustoConnectionStringBuilder: any): Promise<any> {
        return KustoConnectionStringBuilder.withAadDeviceAuthentication(
            clusterUrl, 
            'common', 
            (tokenResponse: any) => {
                const message = `Device Code: ${tokenResponse.userCode}\n\nVisit: ${tokenResponse.verificationUrl}`;
                
                try {
                    if (tokenResponse.verificationUrl && typeof tokenResponse.verificationUrl === 'string') {
                        let url = tokenResponse.verificationUrl;
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                        }
                        const validUrl = new URL(url);
                        
                        vscode.window.showInformationMessage(
                            `Please complete device authentication:\n\nCode: ${tokenResponse.userCode}\nURL: ${validUrl.toString()}`,
                            'Open Browser', 'Copy Code'
                        ).then(selection => {
                            if (selection === 'Open Browser') {
                                vscode.env.openExternal(vscode.Uri.parse(validUrl.toString()));
                            } else if (selection === 'Copy Code') {
                                vscode.env.clipboard.writeText(tokenResponse.userCode);
                                vscode.window.showInformationMessage('Device code copied to clipboard');
                            }
                        });
                    }
                } catch (error) {
                    console.error('Device auth URL handling error:', error);
                    vscode.window.showWarningMessage(
                        `Device Code: ${tokenResponse.userCode}\nPlease visit: ${tokenResponse.verificationUrl}`,
                        'Copy Code'
                    ).then(selection => {
                        if (selection === 'Copy Code') {
                            vscode.env.clipboard.writeText(tokenResponse.userCode);
                        }
                    });
                }
            }
        );
    }
    
    /**
     * Create service principal authentication with proper validation
     */
    private static async createServicePrincipalAuth(clusterUrl: string, KustoConnectionStringBuilder: any): Promise<any> {
        const clientId = await vscode.window.showInputBox({
            prompt: 'Enter Application (Client) ID',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Client ID is required';
                }
                const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!guidRegex.test(value.trim())) {
                    return 'Invalid GUID format. Expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
                }
                return null;
            }
        });
        
        if (!clientId) {
            throw new Error('Client ID is required for service principal authentication');
        }
        
        const clientSecret = await vscode.window.showInputBox({
            prompt: 'Enter Client Secret',
            password: true,
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Client secret is required';
                }
                return null;
            }
        });
        
        if (!clientSecret) {
            throw new Error('Client secret is required for service principal authentication');
        }
        
        const tenantId = await vscode.window.showInputBox({
            prompt: 'Enter Tenant ID (Directory ID)',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or common',
            value: 'common',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Tenant ID is required';
                }
                if (value.trim() === 'common' || value.trim() === 'organizations') {
                    return null; // These are valid values
                }
                const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!guidRegex.test(value.trim())) {
                    return 'Invalid format. Use GUID, "common", or "organizations"';
                }
                return null;
            }
        });
        
        if (!tenantId) {
            throw new Error('Tenant ID is required for service principal authentication');
        }
        
        return KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
            clusterUrl, 
            clientId.trim(), 
            clientSecret.trim(), 
            tenantId.trim()
        );
    }
    
    /**
     * Validate authentication by testing a simple query
     */
    static async validateAuthentication(client: any, database: string): Promise<boolean> {
        try {
            // Test with a simple query that should work on any database
            const testResponse = await Promise.race([
                client.execute(database, 'print "auth_test"'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Authentication validation timeout after 30 seconds')), 30000)
                )
            ]);
            
            return testResponse && testResponse.primaryResults && testResponse.primaryResults.length > 0;
        } catch (error) {
            console.error('Authentication validation failed:', error);
            return false;
        }
    }
    
    /**
     * Handle authentication errors with helpful guidance
     */
    static handleAuthenticationError(error: any, retryCallback?: () => void): void {
        const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
        
        if (errorMessage.toLowerCase().includes('timeout')) {
            vscode.window.showErrorMessage(
                `⏱️ Authentication Timeout\n\n${errorMessage}\n\n` +
                `This usually means:\n` +
                `• Browser authentication is pending - check for browser window\n` +
                `• Network connectivity issues\n` +
                `• MFA verification is required\n\n` +
                `Please complete any pending authentication and try again.`,
                'Retry Connection', 'Try Different Method'
            ).then(selection => {
                if (selection === 'Retry Connection' && retryCallback) {
                    retryCallback();
                }
            });
        } else if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('forbidden')) {
            vscode.window.showErrorMessage(
                `🔒 Access Denied\n\n${errorMessage}\n\n` +
                `Please verify:\n` +
                `• You have access to the cluster and database\n` +
                `• Your account has appropriate permissions\n` +
                `• The cluster URL is correct\n` +
                `• MFA requirements are met`,
                'Try Different Method', 'Check Permissions'
            );
        } else if (errorMessage.toLowerCase().includes('mfa') || errorMessage.toLowerCase().includes('multi-factor')) {
            vscode.window.showErrorMessage(
                `🛡️ Multi-Factor Authentication Required\n\n${errorMessage}\n\n` +
                `Please:\n` +
                `• Complete MFA verification in your browser/app\n` +
                `• Ensure you have access to your MFA device\n` +
                `• Try interactive browser authentication if using device code`,
                'Retry with Browser Auth'
            );
        } else {
            vscode.window.showErrorMessage(
                `❌ Authentication Failed\n\n${errorMessage}\n\n` +
                `Common solutions:\n` +
                `• Try interactive browser authentication\n` +
                `• Check your network connection\n` +
                `• Verify cluster URL and permissions\n` +
                `• Ensure MFA is properly configured`,
                'Retry', 'Try Different Method'
            ).then(selection => {
                if (selection === 'Retry' && retryCallback) {
                    retryCallback();
                }
            });
        }
    }
}
