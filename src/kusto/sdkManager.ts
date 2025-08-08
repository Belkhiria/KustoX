/**
 * Kusto SDK management and utilities
 */

// Dynamic references to avoid TypeScript type checking issues
let KustoClient: any;
let KustoConnectionStringBuilder: any;
let ClientRequestProperties: any;

export async function loadKustoSDK() {
    try {
        const kustoModule = require('azure-kusto-data');
        KustoClient = kustoModule.Client;
        KustoConnectionStringBuilder = kustoModule.KustoConnectionStringBuilder;
        ClientRequestProperties = kustoModule.ClientRequestProperties;
        
        
        if (!KustoClient || !KustoConnectionStringBuilder || !ClientRequestProperties) {
            throw new Error('Failed to load required Kusto SDK components');
        }
    } catch (error) {
        console.error('Failed to load Kusto SDK:', error);
        throw new Error('Failed to load Kusto SDK components');
    }
}

export function getKustoClient() {
    return KustoClient;
}

export function getKustoConnectionStringBuilder() {
    return KustoConnectionStringBuilder;
}

export function getClientRequestProperties() {
    return ClientRequestProperties;
}

// UUID for request IDs
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
