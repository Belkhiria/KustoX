// Test script to verify the user's specific query
const { Client, KustoConnectionStringBuilder } = require('azure-kusto-data');

async function testUserQuery() {
    try {
        console.log('Testing user\'s specific query...');
        
        // Test connection string builder
        const kcsb = KustoConnectionStringBuilder.withUserPrompt('https://help.kusto.windows.net');
        
        // Test client creation
        const client = new Client(kcsb);
        
        // Test user's exact query
        const userQuery = `StormEvents
| take 1
| project StartTime, EndTime, EventType, State, DamageProperty
| summarize TotalEvents = count(), TotalDamage = sum(DamageProperty) by EventType, State`;

        console.log('User query:');
        console.log(userQuery);
        console.log('\nExecuting query...');
        
        const response = await client.execute('Samples', userQuery);
        
        console.log('Response structure:');
        console.log('- Primary results length:', response.primaryResults?.length);
        
        if (response.primaryResults && response.primaryResults.length > 0) {
            const primaryTable = response.primaryResults[0];
            console.log('\nUser query result table:');
            console.log('- Name:', primaryTable.name);
            console.log('- Kind:', primaryTable.kind);
            console.log('- Columns:', primaryTable.columns?.map(col => ({
                name: col.columnName || col.name,
                type: col.columnType || col.type
            })));
            console.log('- _rows length:', primaryTable._rows?.length);
            console.log('- _rows data:', primaryTable._rows);
            
            if (primaryTable._rows && primaryTable._rows.length > 0) {
                console.log('\nExpected result format:');
                const columns = primaryTable.columns.map(col => col.columnName || col.name);
                console.log('Columns:', columns);
                primaryTable._rows.forEach((row, i) => {
                    console.log(`Row ${i}:`, row);
                    const formattedRow = {};
                    columns.forEach((col, colIndex) => {
                        formattedRow[col] = row[colIndex];
                    });
                    console.log(`Row ${i} formatted:`, formattedRow);
                });
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        if (error.message && error.message.includes('authentication')) {
            console.log('This is an authentication error - that\'s expected for this test');
            console.log('The important thing is understanding the query structure');
        }
    }
}

testUserQuery();
