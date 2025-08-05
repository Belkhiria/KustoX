/**
 * Response processing utilities for Kusto queries
 */

import { QueryResult, TruncationCheck } from '../types';

export function processKustoResponse(response: any, executionTimeMs: number): QueryResult {
    try {
        // The Azure Kusto SDK returns a KustoResponseDataSetV2 object
        if (!response || !response.primaryResults || response.primaryResults.length === 0) {
            return {
                columns: ['No Data'],
                rows: [['Query returned no results']],
                executionTime: `${executionTimeMs}ms`,
                rowCount: 0,
                hasData: false,
                totalRows: 0
            };
        }

        // Get the first primary result table
        const primaryTable = response.primaryResults[0];

        // Extract column names
        const columns = primaryTable.columns.map((col: any) => col.columnName || col.name || 'Column');

        // Extract rows from the _rows property (this is the actual data)
        const rows: any[][] = [];
        if (primaryTable._rows && Array.isArray(primaryTable._rows)) {
            for (const row of primaryTable._rows) {
                rows.push(row.map((cell: any) => formatCellValue(cell)));
            }
        } else {
            // Fallback: try to iterate through rows if _rows is not available
            for (const row of primaryTable.rows()) {
                const rowData: any[] = [];
                for (let i = 0; i < columns.length; i++) {
                    rowData.push(formatCellValue(row[i]));
                }
                rows.push(rowData);
            }
        }

        const executionTime = executionTimeMs < 1000 
            ? `${executionTimeMs}ms` 
            : `${(executionTimeMs / 1000).toFixed(2)}s`;

        return {
            columns,
            rows,
            executionTime,
            rowCount: rows.length,
            hasData: rows.length > 0,
            totalRows: rows.length
        };

    } catch (error) {
        return {
            columns: ['Error'],
            rows: [['Failed to process query results: ' + (error instanceof Error ? error.message : 'Unknown error')]],
            executionTime: `${executionTimeMs}ms`,
            rowCount: 0,
            hasData: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export function formatCellValue(cellValue: any): string {
    if (cellValue === null || cellValue === undefined) {
        return 'null';
    }
    if (typeof cellValue === 'object') {
        if (cellValue instanceof Date) {
            return cellValue.toISOString();
        }
        return JSON.stringify(cellValue);
    }
    if (typeof cellValue === 'boolean') {
        return cellValue.toString();
    }
    if (typeof cellValue === 'number') {
        return cellValue.toString();
    }
    return String(cellValue);
}

export function checkForTruncation(response: any, results: any): TruncationCheck {
    try {
        // Check response metadata for truncation indicators
        if (response && response.metadata) {
            // Check for various truncation indicators in metadata
            const metadata = response.metadata;
            
            if (metadata.truncated === true) {
                return { truncated: true, reason: 'Response marked as truncated in metadata' };
            }
            
            if (metadata.resultTruncated === true) {
                return { truncated: true, reason: 'Result truncated flag set in metadata' };
            }
        }

        // Check response for truncation information in different possible locations
        if (response && response.tables) {
            for (const table of response.tables) {
                if (table.metadata && table.metadata.truncated) {
                    return { truncated: true, reason: 'Table marked as truncated' };
                }
            }
        }

        // Only check for specific row limits that actually indicate truncation
        if (results && results.rowCount) {
            // Only very specific limits that actually indicate server-side truncation
            const knownTruncationLimits = [500000]; // Only check for the actual 500K row limit
            if (knownTruncationLimits.includes(results.rowCount)) {
                return { truncated: true, reason: `Row count (${results.rowCount.toLocaleString()}) matches known truncation limit` };
            }
            
            // Don't assume large row counts are truncated - only check for actual truncation markers
            // A query can legitimately return 100K+ rows without being truncated
        }

        return { truncated: false };
    } catch (error) {
        return { truncated: false };
    }
}
