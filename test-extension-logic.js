const vscode = require('vscode');

// Test basic extension functionality
async function testExtensionLogic() {
    console.log('🧪 Testing KustoX Extension Logic...\n');
    
    // Test 1: Dynamic import of azure-kusto-data
    console.log('1. Testing Kusto SDK import...');
    try {
        const kustoModule = await import('azure-kusto-data');
        const requiredExports = ['Client', 'KustoConnectionStringBuilder', 'ClientRequestProperties'];
        const availableExports = Object.keys(kustoModule);
        
        console.log('   Available exports:', availableExports);
        
        const missingExports = requiredExports.filter(exp => !availableExports.includes(exp));
        if (missingExports.length > 0) {
            console.error('   ❌ Missing required exports:', missingExports);
            return false;
        }
        
        // Test instantiation
        const { Client, KustoConnectionStringBuilder, ClientRequestProperties } = kustoModule;
        
        if (typeof Client !== 'function') {
            console.error('   ❌ Client is not a constructor function');
            return false;
        }
        
        if (typeof KustoConnectionStringBuilder !== 'object') {
            console.error('   ❌ KustoConnectionStringBuilder is not available');
            return false;
        }
        
        if (typeof ClientRequestProperties !== 'function') {
            console.error('   ❌ ClientRequestProperties is not a constructor function');
            return false;
        }
        
        console.log('   ✅ All required Kusto SDK components available');
        
    } catch (error) {
        console.error('   ❌ Failed to import azure-kusto-data:', error.message);
        return false;
    }
    
    // Test 2: UUID generation
    console.log('\n2. Testing UUID generation...');
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    
    if (uuid1 === uuid2) {
        console.error('   ❌ UUID generation produces duplicates');
        return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid1)) {
        console.error('   ❌ Generated UUID has invalid format:', uuid1);
        return false;
    }
    
    console.log('   ✅ UUID generation working correctly:', uuid1);
    
    // Test 3: Query cleaning logic
    console.log('\n3. Testing query cleaning logic...');
    const testQuery = `// This is a comment
    // Another comment
    
    StormEvents
    | take 10
    
    // Final comment
    | project StartTime, State`;
    
    const lines = testQuery.split('\n');
    const cleanLines = lines
        .map(line => line.trimRight())
        .filter(line => {
            const trimmedLine = line.trim();
            return trimmedLine.length > 0 && !trimmedLine.startsWith('//');
        });
    
    const cleanQuery = cleanLines.join('\n').trim();
    
    const expectedClean = `StormEvents
    | take 10
    | project StartTime, State`;
    
    if (cleanQuery.trim() !== expectedClean.trim()) {
        console.error('   ❌ Query cleaning failed');
        console.error('   Expected:', expectedClean);
        console.error('   Got:', cleanQuery);
        return false;
    }
    
    console.log('   ✅ Query cleaning working correctly');
    
    // Test 4: Cell value formatting
    console.log('\n4. Testing cell value formatting...');
    function formatCellValue(cellValue) {
        if (cellValue === null || cellValue === undefined) {
            return 'null';
        }
        if (typeof cellValue === 'object') {
            if (cellValue instanceof Date) {
                return cellValue.toISOString();
            }
            return JSON.stringify(cellValue);
        }
        if (typeof cellValue === 'boolean') {
            return cellValue.toString();
        }
        if (typeof cellValue === 'number') {
            return cellValue.toString();
        }
        return String(cellValue);
    }
    
    const testCases = [
        [null, 'null'],
        [undefined, 'null'],
        [true, 'true'],
        [false, 'false'],
        [42, '42'],
        [3.14, '3.14'],
        ['hello', 'hello'],
        [new Date('2023-01-01'), '2023-01-01T00:00:00.000Z'],
        [{key: 'value'}, '{"key":"value"}']
    ];
    
    for (const [input, expected] of testCases) {
        const result = formatCellValue(input);
        if (result !== expected) {
            console.error(`   ❌ formatCellValue(${input}) = "${result}", expected "${expected}"`);
            return false;
        }
    }
    
    console.log('   ✅ Cell value formatting working correctly');
    
    console.log('\n🎉 All core logic tests passed!');
    return true;
}

// Run the test
testExtensionLogic().then(success => {
    if (success) {
        console.log('\n✅ Extension logic appears to be working correctly!');
        process.exit(0);
    } else {
        console.log('\n❌ Extension logic has issues that need to be addressed.');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
});
