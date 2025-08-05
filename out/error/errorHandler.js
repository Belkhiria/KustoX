"use strict";
/**
 * Error handling utilities for Kusto operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseKustoError = void 0;
function parseKustoError(error) {
    let summary = 'Unknown error occurred';
    let details = '';
    let code = '';
    let severity = 'Error';
    let category = 'General';
    let oneApiErrors = [];
    try {
        console.log('Parsing error:', error);
        console.log('Error type:', typeof error);
        console.log('Error constructor:', error?.constructor?.name);
        // Handle string errors
        if (typeof error === 'string') {
            summary = error;
            details = error;
        }
        // Handle Error objects
        else if (error instanceof Error) {
            summary = error.message || 'Error occurred';
            details = error.stack || error.message || 'No details available';
            // Try to extract Kusto-specific error information
            const errorStr = error.toString();
            // Look for Kusto error codes
            const errorCodeMatch = errorStr.match(/([A-Z]_[A-Z_]+|0x[0-9A-F]+)/);
            if (errorCodeMatch) {
                code = errorCodeMatch[1];
            }
            // Categorize common Kusto errors
            if (errorStr.includes('QUERY_RESULT_SET_TOO_LARGE') || errorStr.includes('80DA0003') || errorStr.includes('64 MB')) {
                category = 'Query Limits';
                severity = 'Warning';
                summary = 'Query result set too large (exceeded 64MB limit)';
                details = 'The query returned too much data. Try adding filters, using summarize operations, or limiting results with take operator.';
            }
            else if (errorStr.includes('AUTHENTICATION') || errorStr.includes('UNAUTHORIZED') || errorStr.includes('401')) {
                category = 'Authentication';
                severity = 'Error';
                summary = 'Authentication failed';
            }
            else if (errorStr.includes('TIMEOUT') || errorStr.includes('timeout')) {
                category = 'Timeout';
                severity = 'Warning';
                summary = 'Query execution timed out';
            }
            else if (errorStr.includes('SYNTAX') || errorStr.includes('syntax')) {
                category = 'Query Syntax';
                severity = 'Error';
                summary = 'Query syntax error';
            }
            else if (errorStr.includes('CONNECTION') || errorStr.includes('network') || errorStr.includes('ENOTFOUND')) {
                category = 'Connection';
                severity = 'Error';
                summary = 'Connection error';
            }
        }
        // Handle objects with error information
        else if (error && typeof error === 'object') {
            // Try to extract from common error object patterns
            if (error.message) {
                summary = error.message;
                details = error.stack || error.message;
            }
            else if (error.error) {
                summary = error.error.message || error.error;
                details = error.error.stack || summary;
            }
            else if (error.errorMessage) {
                summary = error.errorMessage;
                details = error.errorDetails || summary;
            }
            // Look for OneApi error format (Azure services often use this)
            if (error.errors && Array.isArray(error.errors)) {
                oneApiErrors = error.errors;
                if (error.errors.length > 0) {
                    const firstError = error.errors[0];
                    summary = firstError.message || summary;
                    code = firstError.code || code;
                }
            }
            // Extract additional properties
            code = error.code || error.errorCode || code;
            severity = error.severity || severity;
            category = error.category || category;
        }
        // Fallback if we still have default values
        if (summary === 'Unknown error occurred') {
            summary = 'An unexpected error occurred during query execution';
            details = error ? JSON.stringify(error, null, 2) : 'No error details available';
        }
    }
    catch (parseError) {
        console.error('Error while parsing Kusto error:', parseError);
        summary = 'Failed to parse error details';
        details = `Original error: ${error}\nParse error: ${parseError}`;
    }
    return {
        summary,
        details,
        code,
        severity,
        category,
        oneApiErrors,
        rawError: error
    };
}
exports.parseKustoError = parseKustoError;
//# sourceMappingURL=errorHandler.js.map