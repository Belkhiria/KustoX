// Enhanced KustoX Result Validator
// This file provides utilities to capture and validate results from the KustoX extension

import * as vscode from 'vscode';

export interface CapturedResult {
    success: boolean;
    rowCount: number;
    columnNames: string[];
    data: any[][];
    error?: string;
    executionTime?: number;
}

export class KustoXResultCapture {
    private static instance: KustoXResultCapture;
    private lastResult: CapturedResult | null = null;
    private resultPromise: Promise<CapturedResult> | null = null;
    private resultResolver: ((result: CapturedResult) => void) | null = null;

    public static getInstance(): KustoXResultCapture {
        if (!KustoXResultCapture.instance) {
            KustoXResultCapture.instance = new KustoXResultCapture();
        }
        return KustoXResultCapture.instance;
    }

    public waitForResult(timeoutMs: number = 10000): Promise<CapturedResult> {
        if (this.resultPromise) {
            return this.resultPromise;
        }

        this.resultPromise = new Promise((resolve, reject) => {
            this.resultResolver = resolve;
            
            setTimeout(() => {
                if (this.resultResolver === resolve) {
                    this.resultResolver = null;
                    this.resultPromise = null;
                    reject(new Error('Timeout waiting for query result'));
                }
            }, timeoutMs);
        });

        return this.resultPromise;
    }

    public captureResult(result: CapturedResult): void {
        this.lastResult = result;
        
        if (this.resultResolver) {
            this.resultResolver(result);
            this.resultResolver = null;
            this.resultPromise = null;
        }
    }

    public getLastResult(): CapturedResult | null {
        return this.lastResult;
    }
}

// Result validation utilities
export class ResultValidator {
    public static validateRowCount(actual: CapturedResult, expected: number, tolerance: number = 0): boolean {
        if (tolerance === 0) {
            return actual.rowCount === expected;
        }
        return Math.abs(actual.rowCount - expected) <= tolerance;
    }

    public static validateColumns(actual: CapturedResult, expectedColumns: string[]): boolean {
        if (actual.columnNames.length !== expectedColumns.length) {
            return false;
        }
        
        return expectedColumns.every(col => actual.columnNames.includes(col));
    }

    public static validateData(actual: CapturedResult, expectedData: any[][]): boolean {
        if (!actual.data || actual.data.length !== expectedData.length) {
            return false;
        }

        for (let i = 0; i < expectedData.length; i++) {
            const actualRow = actual.data[i];
            const expectedRow = expectedData[i];
            
            if (actualRow.length !== expectedRow.length) {
                return false;
            }
            
            for (let j = 0; j < expectedRow.length; j++) {
                if (actualRow[j] !== expectedRow[j]) {
                    return false;
                }
            }
        }
        
        return true;
    }

    public static validateContainsData(actual: CapturedResult, searchValue: any, columnIndex?: number): boolean {
        if (!actual.data) {
            return false;
        }

        if (columnIndex !== undefined) {
            return actual.data.some(row => row[columnIndex] === searchValue);
        }

        return actual.data.some(row => row.includes(searchValue));
    }
}

// Mock result generator for testing the testing framework
export class MockResultGenerator {
    public static generateStormEventsResult(rowCount: number): CapturedResult {
        const columns = ['StartTime', 'EndTime', 'EventType', 'State', 'DamageProperty'];
        const data: any[][] = [];
        
        for (let i = 0; i < rowCount; i++) {
            data.push([
                new Date(2023, 0, i + 1).toISOString(),
                new Date(2023, 0, i + 2).toISOString(),
                ['Tornado', 'Hail', 'Flood'][i % 3],
                ['TX', 'CA', 'FL', 'NY'][i % 4],
                Math.floor(Math.random() * 1000000)
            ]);
        }

        return {
            success: true,
            rowCount: rowCount,
            columnNames: columns,
            data: data,
            executionTime: Math.floor(Math.random() * 2000) + 500
        };
    }

    public static generatePrintResult(value: string): CapturedResult {
        return {
            success: true,
            rowCount: 1,
            columnNames: ['print_0'],
            data: [[value]],
            executionTime: 100
        };
    }

    public static generateEmptyResult(columns: string[]): CapturedResult {
        return {
            success: true,
            rowCount: 0,
            columnNames: columns,
            data: [],
            executionTime: 200
        };
    }

    public static generateErrorResult(errorMessage: string): CapturedResult {
        return {
            success: false,
            rowCount: 0,
            columnNames: [],
            data: [],
            error: errorMessage,
            executionTime: 150
        };
    }

    public static generateAggregationResult(): CapturedResult {
        return {
            success: true,
            rowCount: 3,
            columnNames: ['EventType', 'State', 'TotalEvents', 'TotalDamage'],
            data: [
                ['Tornado', 'TX', 15, 5000000],
                ['Hail', 'CA', 8, 2000000],
                ['Flood', 'FL', 12, 3500000]
            ],
            executionTime: 800
        };
    }
}
