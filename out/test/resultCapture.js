"use strict";
// Enhanced KustoX Result Validator
// This file provides utilities to capture and validate results from the KustoX extension
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockResultGenerator = exports.ResultValidator = exports.KustoXResultCapture = void 0;
class KustoXResultCapture {
    constructor() {
        this.lastResult = null;
        this.resultPromise = null;
        this.resultResolver = null;
    }
    static getInstance() {
        if (!KustoXResultCapture.instance) {
            KustoXResultCapture.instance = new KustoXResultCapture();
        }
        return KustoXResultCapture.instance;
    }
    waitForResult(timeoutMs = 10000) {
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
    captureResult(result) {
        this.lastResult = result;
        if (this.resultResolver) {
            this.resultResolver(result);
            this.resultResolver = null;
            this.resultPromise = null;
        }
    }
    getLastResult() {
        return this.lastResult;
    }
}
exports.KustoXResultCapture = KustoXResultCapture;
// Result validation utilities
class ResultValidator {
    static validateRowCount(actual, expected, tolerance = 0) {
        if (tolerance === 0) {
            return actual.rowCount === expected;
        }
        return Math.abs(actual.rowCount - expected) <= tolerance;
    }
    static validateColumns(actual, expectedColumns) {
        if (actual.columnNames.length !== expectedColumns.length) {
            return false;
        }
        return expectedColumns.every(col => actual.columnNames.includes(col));
    }
    static validateData(actual, expectedData) {
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
    static validateContainsData(actual, searchValue, columnIndex) {
        if (!actual.data) {
            return false;
        }
        if (columnIndex !== undefined) {
            return actual.data.some(row => row[columnIndex] === searchValue);
        }
        return actual.data.some(row => row.includes(searchValue));
    }
}
exports.ResultValidator = ResultValidator;
// Mock result generator for testing the testing framework
class MockResultGenerator {
    static generateStormEventsResult(rowCount) {
        const columns = ['StartTime', 'EndTime', 'EventType', 'State', 'DamageProperty'];
        const data = [];
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
    static generatePrintResult(value) {
        return {
            success: true,
            rowCount: 1,
            columnNames: ['print_0'],
            data: [[value]],
            executionTime: 100
        };
    }
    static generateEmptyResult(columns) {
        return {
            success: true,
            rowCount: 0,
            columnNames: columns,
            data: [],
            executionTime: 200
        };
    }
    static generateErrorResult(errorMessage) {
        return {
            success: false,
            rowCount: 0,
            columnNames: [],
            data: [],
            error: errorMessage,
            executionTime: 150
        };
    }
    static generateAggregationResult() {
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
exports.MockResultGenerator = MockResultGenerator;
//# sourceMappingURL=resultCapture.js.map