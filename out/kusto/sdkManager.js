"use strict";
/**
 * Kusto SDK management and utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUUID = exports.getClientRequestProperties = exports.getKustoConnectionStringBuilder = exports.getKustoClient = exports.loadKustoSDK = void 0;
// Dynamic references to avoid TypeScript type checking issues
let KustoClient;
let KustoConnectionStringBuilder;
let ClientRequestProperties;
async function loadKustoSDK() {
    try {
        const kustoModule = require('azure-kusto-data');
        KustoClient = kustoModule.Client;
        KustoConnectionStringBuilder = kustoModule.KustoConnectionStringBuilder;
        ClientRequestProperties = kustoModule.ClientRequestProperties;
        console.log('Azure Kusto SDK initialized');
        console.log('KustoClient loaded:', typeof KustoClient);
        console.log('KustoConnectionStringBuilder loaded:', typeof KustoConnectionStringBuilder);
        console.log('ClientRequestProperties loaded:', typeof ClientRequestProperties);
        if (!KustoClient || !KustoConnectionStringBuilder || !ClientRequestProperties) {
            throw new Error('Failed to load required Kusto SDK components');
        }
    }
    catch (error) {
        console.error('Failed to load Kusto SDK:', error);
        throw new Error('Failed to load Kusto SDK components');
    }
}
exports.loadKustoSDK = loadKustoSDK;
function getKustoClient() {
    return KustoClient;
}
exports.getKustoClient = getKustoClient;
function getKustoConnectionStringBuilder() {
    return KustoConnectionStringBuilder;
}
exports.getKustoConnectionStringBuilder = getKustoConnectionStringBuilder;
function getClientRequestProperties() {
    return ClientRequestProperties;
}
exports.getClientRequestProperties = getClientRequestProperties;
// UUID for request IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
exports.generateUUID = generateUUID;
//# sourceMappingURL=sdkManager.js.map