# KustoX Extension Test Results

## Test Environment
- Extension Version: 0.1.0
- Test Date: _____________
- Kusto Cluster: https://help.kusto.windows.net
- Database: Samples

## Test Results

### TEST 1: Basic Data Retrieval
- **Expected**: 5 rows with columns: StartTime, EndTime, EventType, State, DamageProperty
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 2: Simple Aggregation (Original Problem)
- **Expected**: 1 row with columns: EventType, State, TotalEvents, TotalDamage
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 3: Multiple Aggregations
- **Expected**: Multiple rows grouped by EventType
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 4: Complex Filtering and Projection
- **Expected**: Tornado events with calculated fields (10 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 5: Time-based Analysis
- **Expected**: Monthly counts (12 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 6: Complex Join-like Operation
- **Expected**: Events grouped by time bins and damage ranges
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 7: String Operations
- **Expected**: Events with narrative analysis (20 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 8: Mathematical Operations
- **Expected**: Complex damage calculations (15 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 9: Complex Conditional Logic
- **Expected**: Events with severity scoring (25 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 10: Advanced Time Series
- **Expected**: Rolling statistics (36 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 11: Data Type Handling
- **Expected**: Various data type operations (30 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 12: Error-Prone Query (Should Fail)
- **Expected**: Error due to invalid column names
- **Actual Rows**: ______
- **Error Message**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS (Error shown correctly) / ❌ FAIL
- **Notes**: ______________________________

### TEST 13: Empty Result Query
- **Expected**: 0 rows, no error
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Error Message**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

### TEST 14: Performance Test
- **Expected**: Large aggregation (100 rows max)
- **Actual Rows**: ______
- **Actual Columns**: ______________________________
- **Sample First Row**: ______________________________
- **Execution Time**: ______
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: ______________________________

## Summary
- **Total Tests**: 14
- **Passed**: ______
- **Failed**: ______
- **Success Rate**: ______%

## Critical Issues Found
1. ______________________________
2. ______________________________
3. ______________________________

## Performance Notes
- **Fastest Query**: ______________________________
- **Slowest Query**: ______________________________
- **Average Execution Time**: ______________________________

## Extension Behavior Notes
- Query selection working correctly: ✅ / ❌
- Multi-line queries processed correctly: ✅ / ❌
- Error handling working: ✅ / ❌
- Results display formatting: ✅ / ❌
- Column extraction correct: ✅ / ❌
- Row data accurate: ✅ / ❌
