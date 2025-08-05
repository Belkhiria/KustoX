const testQuery = `let myAppName = 'e23bba2a1277';
let myStartTime = datetime(2025-07-28 19:30);
let myEndTime = datetime(2025-07-28 20:40);

MonSqlDumperActivity
| where TargetAppName has myAppName
| where TIMESTAMP between (myStartTime .. myEndTime)
| where CompleteFileName endswith '.dmp'
| distinct
    FileTime,
    ClusterName,
    NodeName,
    CompleteFileName,
    FileSize,
    DumperStartTime,
    DumperEndTime,
    IsWatsonInvoke,
    SubmitResultDesc,
    DumpUID
| as Dumps;

MonDwEngineLogs
| where AppName has myAppName
| where TIMESTAMP between (myStartTime .. myEndTime)
| where EventName == "EngineInstrumentation:EngineInitializationEndEvent"
| project TIMESTAMP, LogicalServerName, AppName, EventName, Message, ClusterName
| order by TIMESTAMP asc
| as EngineRestart;

MonDwDmsLogs
| where AppName has myAppName
| where TIMESTAMP between (myStartTime .. myEndTime)
| where Message contains "DMS Service started"
| project TIMESTAMP, LogicalServerName, AppName, EventName, Message, ClusterName
| order by TIMESTAMP asc
| as DMSRestart;`;

console.log('=== Testing COMPLETE parsing logic ===');

// Test the '| as Name;' pattern
const hasAsQueryPattern = /\|\s*as\s+\w+\s*;/.test(testQuery);
console.log('Has | as Name; pattern:', hasAsQueryPattern);

// Test semicolon splitting with improved logic
function splitQueriesBySemicolon(text) {
    const queries = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let i = 0;
    
    while (i < text.length) {
        const char = text[i];
        
        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
        } else if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
        } else if (char === ';' && !inSingleQuote && !inDoubleQuote) {
            // Found a semicolon outside of quotes - but we need to check if it's a query separator
            
            // Look ahead to see what comes after this semicolon
            let nextNonWhitespaceIndex = i + 1;
            while (nextNonWhitespaceIndex < text.length && /\s/.test(text[nextNonWhitespaceIndex])) {
                nextNonWhitespaceIndex++;
            }
            
            const remainingText = text.substring(nextNonWhitespaceIndex);
            
            // Check if this semicolon is followed by a new query (not a let statement)
            // A new query typically starts with a table name or 'print', not 'let'
            const isQuerySeparator = /^((?!let\s)\w+\s*\||\w+\s*$|print\s)/i.test(remainingText);
            
            if (isQuerySeparator) {
                // This is a genuine query separator
                queries.push(current + char); // Include the semicolon in the query
                current = '';
                i++;
                continue;
            } else {
                // This is just a semicolon in Kusto syntax (like after a let statement)
                // Include it in the current query and continue
                current += char;
            }
        } else {
            current += char;
        }
        
        i++;
    }
    
    // Add the last query if there's remaining content
    if (current.trim()) {
        queries.push(current);
    }
    
    return queries;
}

// Now test the complete parsing logic
const parts = splitQueriesBySemicolon(testQuery);
console.log('\n=== Split into', parts.length, 'parts ===');

const queries = [];

// In Kusto multiple query syntax, let statements at the beginning are shared
// We need to identify let statements and prepend them to each actual query
let letStatements = '';
let actualQueries = [];

for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    
    // Check if this part contains only let statements
    const lines = part.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const isOnlyLetStatements = lines.every(line => 
        line.startsWith('let ') || 
        line.startsWith('//') ||
        line === '' ||
        line.endsWith(';') && line.indexOf('|') === -1 && line.indexOf('print') === -1
    );
    
    if (isOnlyLetStatements) {
        // This part contains only let statements - save them to prepend to actual queries
        letStatements = part;
        console.log('\n🔧 Found let statements part:');
        console.log(letStatements);
    } else {
        // This is an actual query
        actualQueries.push(part);
        console.log(`\n📄 Found actual query part ${actualQueries.length}:`, part.substring(0, 100) + '...');
    }
}

console.log('\n=== Processing', actualQueries.length, 'actual queries ===');

// Process each actual query
for (let i = 0; i < actualQueries.length; i++) {
    let queryPart = actualQueries[i].trim();
    if (!queryPart) continue;
    
    // Check if query ends with "| as QueryName"
    const asMatch = queryPart.match(/^(.*?)\|\s*as\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?\s*$/is);
    if (asMatch) {
        // Extract the actual query (without the "| as QueryName" part)
        const actualQuery = asMatch[1].trim();
        const queryName = asMatch[2].trim();
        const fullQuery = letStatements ? (letStatements + '\n\n' + actualQuery) : actualQuery;
        queries.push({
            query: fullQuery,
            name: queryName
        });
        console.log(`🔧 Extracted query "${queryName}" - REMOVED "| as" syntax from actual query`);
    } else {
        // Regular query without alias
        const cleanQuery = queryPart.replace(/;$/, '').trim();
        const fullQuery = letStatements ? (letStatements + '\n\n' + cleanQuery) : cleanQuery;
        queries.push({
            query: fullQuery
        });
    }
}

console.log('\n=== FINAL RESULT: Will execute', queries.length, 'queries ===');
queries.forEach((q, i) => {
    console.log(`\n📋 Query ${i + 1} (Name: ${q.name || 'Unnamed'}):`);
    console.log('─'.repeat(50));
    console.log(q.query);
    console.log('─'.repeat(50));
});
