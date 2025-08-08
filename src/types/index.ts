/**
 * Type definitions for KustoX extension
 */

export interface KustoConnection {
    client: any;
    cluster: string;
    database: string;
    alias?: string;  // Optional display name for the cluster
}

export interface ConnectionItem {
    type: 'cluster' | 'database' | 'table';
    name: string;
    cluster?: string;
    database?: string;
    table?: string;
    children?: ConnectionItem[];
    alias?: string;  // Optional display name for clusters
}

export interface QueryResult {
    columns: string[];
    rows: any[][];
    executionTime: string;
    rowCount: number;
    hasData: boolean;
    totalRows?: number;
    error?: string;
}

export interface ParsedError {
    summary: string;
    details: string;
    code?: string;
    severity?: string;
    category?: string;
    oneApiErrors?: any[];
    rawError: any;
}

export interface TruncationCheck {
    truncated: boolean;
    reason?: string;
}

export interface ChartData {
    labels?: string[];
    datasets?: any[];
    data?: any[];
}
