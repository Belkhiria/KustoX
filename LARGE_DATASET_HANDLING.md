# KustoX Large Dataset Handling

## Overview

This document describes the enhanced large dataset handling capabilities implemented in KustoX to address the Azure Kusto SDK's 64MB query result limit, similar to Kusto Explorer's behavior.

## Problem Statement

When queries return results exceeding 64MB, the Azure Kusto SDK:
- Throws an error without returning partial results
- Provides no access to data that was retrieved before hitting the limit
- Requires alternative approaches to access large datasets

## Solution Approach

KustoX now implements a multi-tier approach to handle large datasets:

### 1. Enhanced Streaming Query Execution

The extension now uses advanced Azure Kusto SDK parameters:

```typescript
// Enhanced streaming parameters - CONSISTENT high limits
incrementalCrp.setOption('query_results_progressive_enabled', true);
incrementalCrp.setOption('deferpartialqueryfailures', true);
incrementalCrp.setOption('results_progressive_enabled', true);
incrementalCrp.setOption('notruncation', true); // Disable automatic truncation
incrementalCrp.setOption('truncationmaxrecords', 1000000); // High limit - 1M records
incrementalCrp.setOption('truncationmaxsize', 134217728); // High limit - 128 MB
incrementalCrp.setOption('servertimeout', '00:05:00'); // Server timeout
```

**Key Change:** All query approaches now use **consistently high limits** (128MB, 1M records) instead of the previous inconsistent approach where main queries used reduced limits (32MB, 100K records) which was counterproductive.

### 2. Multi-Tier Fallback System

When the main query fails, KustoX attempts multiple approaches:

1. **Enhanced streaming (100K rows)** - Uses streaming parameters with `take 100000`
2. **Large chunks (10K rows)** - Streaming enabled with `take 10000`
3. **Medium chunks (1000 rows)** - Standard query with `take 1000`
4. **Small chunks (100 rows)** - Minimal query with `take 100`
5. **Minimal chunk (10 rows)** - Last resort with `take 10`

### 3. Pagination Command

A new command `KustoX: Execute Query with Pagination` allows users to:
- Specify custom page sizes (1-100,000 rows)
- Set maximum number of pages (1-100)
- Progressively load large datasets
- View combined results from multiple pages

## Key Features

### Streaming Parameters
Based on Azure Kusto SDK documentation, the extension uses:
- `notruncation`: Prevents automatic result truncation  
- `truncationmaxsize`: Sets higher size limits (128MB)
- `truncationmaxrecords`: Allows up to 1M records
- `query_results_progressive_enabled`: Enables progressive loading
- `deferpartialqueryfailures`: Allows partial failures

### User Experience Improvements
- **Partial Results Display**: When queries exceed limits, users see available data
- **Error Details**: Comprehensive error information in a separate panel (like Kusto Explorer)
- **Suggestions**: Contextual advice for handling large datasets
- **Progress Indication**: Real-time feedback during pagination
- **Cancellation Support**: Users can cancel long-running operations

### Enhanced Error Handling
```typescript
const enhancedError = {
    ...originalError,
    suggestions: [
        'Consider using pagination with "take" and "skip" operators',
        'Try the "KustoX: Execute Query with Pagination" command for very large datasets',
        'Add more specific "where" clauses to filter data',
        'Use "summarize" to aggregate large datasets',
        'Break the query into smaller time windows',
        'For datasets with very large individual rows, consider selecting fewer columns'
    ]
};
```

## Usage Examples

### Regular Query Execution
When a query exceeds 64MB:
1. KustoX shows partial results (e.g., first 100K rows)
2. Displays error details with suggestions
3. Marks results as partial with explanation

### Pagination Command
```
Command Palette > KustoX: Execute Query with Pagination
- Page size: 1000 (customize)
- Max pages: 10 (customize)
- Progressively loads and combines results
```

### Query Optimization Suggestions
- Use `where` clauses to filter data
- Apply `summarize` for aggregations
- Select specific columns instead of `*`
- Use time-based filtering for temporal data

## Technical Implementation

### Client Request Properties
Each approach uses optimized `ClientRequestProperties`:
- Unique request IDs for tracking
- Appropriate timeouts (30s to 5min)
- Streaming parameters for large chunks
- Standard parameters for small chunks

### Result Processing
- Maintains column structure across pages
- Tracks total row counts
- Preserves execution timing information
- Handles partial result indicators

### Error Recovery
- Graceful degradation through fallback approaches
- Comprehensive error logging for debugging
- User-friendly error messages with actionable suggestions

## Benefits

1. **Data Access**: Users can access partial results even when full query fails
2. **Flexibility**: Multiple approaches for different dataset sizes
3. **User Control**: Pagination command for custom chunking
4. **Performance**: Optimized parameters for better throughput
5. **Reliability**: Fallback mechanisms ensure some data is always returned

## Future Enhancements

- Automatic query optimization suggestions
- Smart pagination based on data characteristics
- Integration with Azure Data Explorer streaming APIs
- Query result caching for repeated operations
- Advanced filtering UI for large datasets

## Commands Available

1. `KustoX: Execute Query` - Enhanced with fallback mechanisms
2. `KustoX: Execute Query with Pagination` - Custom pagination control
3. `KustoX: Show Connection Status` - Connection information
4. `KustoX: Configure Connection` - Connection setup

## Configuration Options

The extension automatically applies optimal settings, but users can:
- Adjust query timeouts through Azure Kusto SDK parameters
- Customize pagination sizes via the pagination command
- Control streaming behavior through enhanced client request properties

This implementation ensures KustoX provides a robust experience for handling large datasets while maintaining compatibility with the Azure Kusto SDK limitations.
