# KustoX Testing Framework

This document explains how to use the comprehensive testing framework for the KustoX extension to validate that your Kusto queries return correct results.

## 🎯 Testing Overview

The KustoX testing framework provides automated validation to ensure your extension returns correct query results. It includes:

1. **Integration Tests** - Basic functionality validation
2. **Comprehensive Tests** - Detailed result validation including your original multi-line query issue
3. **Result Capture** - Utilities to capture and validate actual query results

## 🚀 Quick Start

### 1. Setup
```bash
# Compile the extension
npm run compile

# Or use the test runner script
./test-runner.sh
```

### 2. Configure Connection
1. Open VS Code in the KustoX directory
2. Press `F1` and run `KustoX: Configure Connection`
3. Use these settings:
   - **Cluster**: `https://help.kusto.windows.net`
   - **Database**: `Samples`
   - **Authentication**: Choose "Interactive Browser" (recommended)

### 3. Run Tests
1. Press `F1` and search for `KustoX: Run Comprehensive Tests`
2. Wait for all tests to complete
3. Review the generated test report

## 📋 Test Categories

### Basic Tests
- **Simple Take Query**: `StormEvents | take 10`
- **Print Statement**: `print "Hello KustoX"`
- **Empty Results**: Queries that return no data

### Your Original Issue Test
```kusto
StormEvents
| take 1
| project StartTime, EndTime, EventType, State, DamageProperty
| summarize TotalEvents = count(), TotalDamage = sum(DamageProperty) by EventType, State
```
This test specifically validates that multi-line queries work correctly and return the expected single aggregated row.

### Advanced Tests
- **Complex Aggregation**: Multi-step queries with filtering and grouping
- **Error Handling**: Invalid queries that should fail gracefully
- **Large Results**: Queries returning 100+ rows

## 📊 Understanding Test Results

### Test Report Structure
```markdown
# KustoX Comprehensive Test Report

## Executive Summary
- Total Tests: 7
- Passed: 7 ✅
- Failed: 0 ❌
- Success Rate: 100%

## Detailed Test Results
### Test 1: basic_take_query ✅ PASS
- Expected: 10 rows
- Actual: 10 rows
- Columns: [StartTime, EndTime, EventType, ...]
```

### Result Validation
Each test validates:
- **Row Count**: Exact number of returned rows
- **Column Names**: Expected column structure
- **Data Content**: Specific data values (where applicable)
- **Error Messages**: For tests that should fail

## 🧪 Test Framework Components

### Files Created
- `src/test/comprehensiveTests.ts` - Main test suite
- `src/test/integrationTests.ts` - Basic integration tests
- `src/test/resultCapture.ts` - Result validation utilities
- `test-runner.sh` - Quick setup script

### Key Classes
- **ComprehensiveTestRunner**: Executes all tests and generates reports
- **KustoXResultCapture**: Captures actual query results from the extension
- **ResultValidator**: Validates query results against expected outcomes

## 🔧 Customizing Tests

### Adding New Tests
Add to `COMPREHENSIVE_TEST_SUITE` in `comprehensiveTests.ts`:

```typescript
{
    name: "my_custom_test",
    description: "Description of what this tests",
    query: `StormEvents | where State == "TX" | take 5`,
    validate: (result: CapturedResult): TestResult => {
        if (result.rowCount !== 5) {
            return { passed: false, message: "Expected 5 rows" };
        }
        return { passed: true, message: "Test passed!" };
    },
    expectedRowCount: 5,
    timeout: 5000
}
```

### Custom Validation
```typescript
validate: (result: CapturedResult): TestResult => {
    // Check if query succeeded
    if (!result.success) {
        return { passed: false, message: "Query failed", details: result.error };
    }
    
    // Validate row count
    if (result.rowCount !== expectedCount) {
        return { passed: false, message: `Expected ${expectedCount}, got ${result.rowCount}` };
    }
    
    // Validate columns
    if (!ResultValidator.validateColumns(result, ["Col1", "Col2"])) {
        return { passed: false, message: "Column validation failed" };
    }
    
    // Validate specific data
    if (!ResultValidator.validateContainsData(result, "Texas", 1)) {
        return { passed: false, message: "Expected 'Texas' in column 1" };
    }
    
    return { passed: true, message: "All validations passed!" };
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Tests Time Out**
   - Increase timeout in test configuration
   - Check Kusto connection is working
   - Verify queries run manually first

2. **Connection Errors**
   - Ensure you've configured the connection first
   - Try "Interactive Browser" authentication
   - Verify cluster URL and database name

3. **Mock Results vs Real Results**
   - Tests use mock data if real capture fails
   - This allows testing the test framework itself
   - Real integration requires connection to Kusto

### Debug Logging
Enable detailed logging in VS Code:
1. Open Developer Tools (`Help > Toggle Developer Tools`)
2. Check Console for detailed test execution logs
3. Look for `🧪 Test` and `🔬` messages

## 📈 Performance Guidelines

- **Test Timing**: Each test has configurable timeout (default 5-10 seconds)
- **Delay Between Tests**: 1.5 second delay prevents overwhelming the system
- **Resource Usage**: Tests run sequentially to avoid conflicts

## 🎯 Expected Results

### Perfect Score (100%)
All tests pass, indicating:
- Multi-line queries work correctly
- Row counts are accurate
- Column extraction works
- Error handling functions properly

### Common Failure Patterns
- **Multi-line Query Issues**: Your original problem - queries return wrong row counts
- **Column Extraction**: Column names not properly parsed from Kusto responses
- **Authentication**: Connection issues preventing query execution

## 🚀 Integration with Development

### Continuous Testing
Run tests after making changes:
```bash
npm run compile && code .
# Then run: KustoX: Run Comprehensive Tests
```

### Before Release
1. Run comprehensive test suite
2. Verify 100% pass rate
3. Test with different Kusto clusters
4. Validate error scenarios

## 📞 Support

If tests reveal issues:
1. Check the detailed test report for specific failures
2. Run failing queries manually in KustoX
3. Compare with expected results in the test definitions
4. Review Azure Kusto SDK response processing in `extension.ts`

The testing framework is designed to catch the exact issues you experienced with multi-line queries and incorrect result processing. Use it regularly to ensure KustoX maintains high quality and accuracy!
