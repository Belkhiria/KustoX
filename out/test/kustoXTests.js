"use strict";
// Unit Test Suite for KustoX Extension
// This file will be used to create automated tests that verify query results
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_QUERIES = exports.KustoXTestSuite = void 0;
class KustoXTestSuite {
    constructor() {
        this.testResults = [];
        this.initializeTests();
    }
    initializeTests() {
        this.testResults = [
            {
                query: `StormEvents
| take 5
| project StartTime, EndTime, EventType, State, DamageProperty`,
                expectedRows: 5,
                expectedColumns: ['StartTime', 'EndTime', 'EventType', 'State', 'DamageProperty'],
                description: 'Basic Data Retrieval - Should return 5 rows with basic storm event data'
            },
            {
                query: `StormEvents
| take 1
| project StartTime, EndTime, EventType, State, DamageProperty
| summarize TotalEvents = count(), TotalDamage = sum(DamageProperty) by EventType, State`,
                expectedRows: 1,
                expectedColumns: ['EventType', 'State', 'TotalEvents', 'TotalDamage'],
                description: 'Simple Aggregation - Original problem query should return 1 aggregated row'
            },
            {
                query: `StormEvents
| take 100
| summarize 
    TotalEvents = count(),
    AvgDamage = avg(DamageProperty),
    MaxDamage = max(DamageProperty),
    MinDamage = min(DamageProperty)
    by EventType
| order by TotalEvents desc`,
                expectedRows: -1,
                expectedColumns: ['EventType', 'TotalEvents', 'AvgDamage', 'MaxDamage', 'MinDamage'],
                description: 'Multiple Aggregations - Should group by EventType with calculated fields'
            },
            {
                query: `StormEvents
| where EventType == "Tornado"
| where State in ("TEXAS", "KANSAS", "OKLAHOMA")
| extend TotalDamage = DamageProperty + DamageCrops
| extend DamageCategory = case(
    TotalDamage == 0, "No Damage",
    TotalDamage < 10000, "Low",
    TotalDamage < 100000, "Medium",
    TotalDamage < 1000000, "High",
    "Severe"
)
| project StartTime, State, EventType, TotalDamage, DamageCategory
| order by TotalDamage desc
| take 10`,
                expectedRows: 10,
                expectedColumns: ['StartTime', 'State', 'EventType', 'TotalDamage', 'DamageCategory'],
                description: 'Complex Filtering - Tornado events with calculated damage categories'
            },
            {
                query: `StormEvents
| extend Month = startofmonth(StartTime)
| summarize EventCount = count() by Month
| order by Month asc
| take 12`,
                expectedRows: 12,
                expectedColumns: ['Month', 'EventCount'],
                description: 'Time-based Analysis - Monthly counts should return 12 months'
            },
            {
                query: `StormEvents
| project InvalidColumnName, AnotherInvalidColumn
| take 5`,
                expectedRows: 0,
                expectedColumns: [],
                shouldFail: true,
                description: 'Error Handling - Should fail gracefully with invalid column names'
            },
            {
                query: `StormEvents
| where EventType == "NonExistentEventType"
| project StartTime, EventType, State`,
                expectedRows: 0,
                expectedColumns: ['StartTime', 'EventType', 'State'],
                description: 'Empty Result - Should return 0 rows but succeed with correct columns'
            },
            {
                query: `print "Hello World"`,
                expectedRows: 1,
                expectedColumns: ['print_0'],
                expectedData: [['Hello World']],
                description: 'Simple Print - Basic functionality test'
            }
        ];
    }
    getTests() {
        return this.testResults;
    }
    async runTest(testIndex, actualResult) {
        const test = this.testResults[testIndex];
        if (!test) {
            throw new Error(`Test ${testIndex} not found`);
        }
        try {
            // Test for expected failure
            if (test.shouldFail) {
                if (actualResult.error || actualResult.rowCount === 0) {
                    console.log(`✅ ${test.description} - Failed as expected`);
                    return true;
                }
                else {
                    console.log(`❌ ${test.description} - Should have failed but didn't`);
                    return false;
                }
            }
            // Test row count (if specified)
            if (test.expectedRows >= 0) {
                if (actualResult.rowCount !== test.expectedRows) {
                    console.log(`❌ ${test.description} - Expected ${test.expectedRows} rows, got ${actualResult.rowCount}`);
                    return false;
                }
            }
            // Test column names
            if (test.expectedColumns.length > 0) {
                const actualColumns = actualResult.columns || [];
                if (!this.arraysEqual(actualColumns, test.expectedColumns)) {
                    console.log(`❌ ${test.description} - Column mismatch`);
                    console.log(`   Expected: [${test.expectedColumns.join(', ')}]`);
                    console.log(`   Actual:   [${actualColumns.join(', ')}]`);
                    return false;
                }
            }
            // Test specific data (if specified)
            if (test.expectedData) {
                const actualData = actualResult.rows || [];
                if (!this.dataMatches(actualData, test.expectedData)) {
                    console.log(`❌ ${test.description} - Data mismatch`);
                    console.log(`   Expected: ${JSON.stringify(test.expectedData)}`);
                    console.log(`   Actual:   ${JSON.stringify(actualData)}`);
                    return false;
                }
            }
            console.log(`✅ ${test.description} - PASSED`);
            return true;
        }
        catch (error) {
            console.log(`❌ ${test.description} - Error during validation: ${error}`);
            return false;
        }
    }
    arraysEqual(a, b) {
        if (a.length !== b.length)
            return false;
        return a.every((val, i) => val === b[i]);
    }
    dataMatches(actual, expected) {
        if (actual.length !== expected.length)
            return false;
        return actual.every((row, i) => row.length === expected[i].length &&
            row.every((cell, j) => cell === expected[i][j]));
    }
    generateTestReport(results) {
        const passed = results.filter(r => r).length;
        const total = results.length;
        const percentage = Math.round((passed / total) * 100);
        let report = `
# KustoX Extension Test Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Tests**: ${total}
- **Passed**: ${passed}
- **Failed**: ${total - passed}
- **Success Rate**: ${percentage}%

## Test Results
`;
        this.testResults.forEach((test, i) => {
            const status = results[i] ? '✅ PASS' : '❌ FAIL';
            report += `
### Test ${i + 1}: ${status}
**Description**: ${test.description}
**Expected Rows**: ${test.expectedRows >= 0 ? test.expectedRows : 'Variable'}
**Expected Columns**: [${test.expectedColumns.join(', ')}]
**Should Fail**: ${test.shouldFail ? 'Yes' : 'No'}
`;
        });
        return report;
    }
}
exports.KustoXTestSuite = KustoXTestSuite;
// Export test queries for easy copy-paste
exports.TEST_QUERIES = {
    basic: `StormEvents | take 5 | project StartTime, EndTime, EventType, State, DamageProperty`,
    aggregation: `StormEvents | take 1 | project StartTime, EndTime, EventType, State, DamageProperty | summarize TotalEvents = count(), TotalDamage = sum(DamageProperty) by EventType, State`,
    multipleAgg: `StormEvents | take 100 | summarize TotalEvents = count(), AvgDamage = avg(DamageProperty), MaxDamage = max(DamageProperty), MinDamage = min(DamageProperty) by EventType | order by TotalEvents desc`,
    complexFilter: `StormEvents | where EventType == "Tornado" | where State in ("TEXAS", "KANSAS", "OKLAHOMA") | extend TotalDamage = DamageProperty + DamageCrops | extend DamageCategory = case(TotalDamage == 0, "No Damage", TotalDamage < 10000, "Low", TotalDamage < 100000, "Medium", TotalDamage < 1000000, "High", "Severe") | project StartTime, State, EventType, TotalDamage, DamageCategory | order by TotalDamage desc | take 10`,
    timeAnalysis: `StormEvents | extend Month = startofmonth(StartTime) | summarize EventCount = count() by Month | order by Month asc | take 12`,
    errorTest: `StormEvents | project InvalidColumnName, AnotherInvalidColumn | take 5`,
    emptyResult: `StormEvents | where EventType == "NonExistentEventType" | project StartTime, EventType, State`,
    simpleTest: `print "Hello World"`
};
//# sourceMappingURL=kustoXTests.js.map