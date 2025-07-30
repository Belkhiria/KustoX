# Enhanced Error Reporting

KustoX now provides detailed, actionable error messages when queries fail, going beyond generic HTTP status codes to show the actual Kusto parsing and semantic errors.

## Error Reporting Features

### Before (Generic Errors)
```
❌ Error Details:
Request failed with status code 400
```

### After (Detailed Errors)
```
❌ Query execution failed: 'project' operator: Failed to resolve scalar expression named 'DamagePropertyy'

Error Category: Semantic Error
Error Code: SEM001
```

## Error Types Detected

### 1. **Column Resolution Errors**
- **Pattern**: `Failed to resolve scalar expression named 'ColumnName'`
- **Cause**: Referenced column doesn't exist in the source table
- **Example**: `| project NonExistentColumn`

### 2. **Function Errors**
- **Pattern**: `Unknown function 'functionName'`
- **Cause**: Using non-existent or misspelled function names
- **Example**: `| extend x = invalidfunc(column)`

### 3. **Syntax Errors**
- **Pattern**: Various syntax error messages
- **Cause**: Malformed KQL syntax, missing parentheses, etc.
- **Example**: `| where StartTime >= ago(7d` (missing closing parenthesis)

### 4. **Table Resolution Errors**
- **Pattern**: `Table 'TableName' not found`
- **Cause**: Referenced table doesn't exist or isn't accessible
- **Example**: `NonExistentTable | project *`

### 5. **Type Mismatch Errors**
- **Pattern**: Type conversion or comparison errors
- **Cause**: Incompatible data types in operations
- **Example**: `| where DateColumn == "invalid_date"`

### 6. **Operator Errors**
- **Pattern**: `Unknown operator 'operatorName'`
- **Cause**: Using invalid or misspelled operators
- **Example**: `| where column contains_all "value"`

## Error Display Features

### Detailed Error Panel
When a query fails, KustoX opens a comprehensive error panel showing:

- **Error Summary**: Clear, specific error message
- **Error Category**: Type of error (Syntax, Semantic, etc.)
- **Error Code**: Kusto-specific error codes when available
- **Query Context**: The exact query that failed
- **Troubleshooting Tips**: Contextual help based on error type

### Error Message Structure
```typescript
{
  summary: string;        // Main error message
  details: string;        // Detailed error information
  code?: string;          // Error code if available
  severity?: string;      // Error severity (Error, Warning)
  category?: string;      // Error category
  oneApiErrors?: any[];   // Multiple errors if present
  rawError: any;          // Original error for debugging
}
```

## Error Parsing Logic

### HTTP Response Parsing
The extension intelligently parses various error response formats:

1. **OneAPI Error Format** (Kusto-specific)
   ```json
   {
     "error": {
       "innererror": {
         "message": "'project' operator: Failed to resolve scalar expression named 'DamagePropertyy'"
       }
     }
   }
   ```

2. **Standard Error Format**
   ```json
   {
     "error": {
       "message": "Query parsing error",
       "code": "BadRequest"
     }
   }
   ```

3. **Multiple Errors**
   ```json
   {
     "error": {
       "@odata.errors": [
         {
           "message": "Error 1 description",
           "code": "SEM001"
         },
         {
           "message": "Error 2 description", 
           "code": "SYN002"
         }
       ]
     }
   }
   ```

### Error Message Extraction
- Parses JSON error responses from Kusto service
- Extracts inner error messages for detailed diagnostics
- Handles nested error structures
- Falls back to generic messages when specific parsing fails

## Testing Error Handling

Use the provided `error-test-queries.kql` file to test various error scenarios:

```kusto
// Column name typo
StormEvents
| project StartTime, EventType, DamagePropertyy  // Extra 'y'
| take 10;

// Invalid function
StormEvents  
| extend x = invalidfunction(StartTime)
| take 5;

// Missing parenthesis
StormEvents
| where StartTime >= ago(7d  // Missing ')'
| take 10;
```

## Troubleshooting Tips

The error panel includes contextual troubleshooting suggestions:

- **Column/Property Errors**: Check column existence and spelling
- **Syntax Errors**: Verify KQL syntax and brackets
- **Table Errors**: Confirm table names and access permissions
- **Function Errors**: Validate function names and parameters
- **Authentication Errors**: Check connection and credentials

## Benefits

1. **Faster Debugging**: Specific error messages help identify issues quickly
2. **Better Learning**: Detailed errors help users learn KQL syntax
3. **Reduced Frustration**: No more generic "400 Bad Request" errors
4. **Professional Experience**: Similar to Kusto Explorer error reporting
5. **Context-Aware Help**: Targeted suggestions based on error types

## Implementation Details

The enhanced error reporting is implemented through:

- **parseKustoError()**: Intelligently parses various error response formats
- **Enhanced UI**: Rich error display with categorization and tips
- **Backward Compatibility**: Handles both old and new error formats
- **Comprehensive Parsing**: Supports multiple Kusto error response structures

This provides a professional, user-friendly experience that helps developers quickly identify and fix query issues.
