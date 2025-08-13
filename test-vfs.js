/**
 * Test script for Virtual File System functionality
 * This can be used to test the VFS without running full queries
 */

const testVFS = {
    // Mock query result for testing
    mockResult: {
        columns: ['Timestamp', 'EventType', 'State', 'DamageProperty'],
        rows: [
            ['2025-01-01T10:00:00Z', 'Tornado', 'Kansas', 50000],
            ['2025-01-01T11:00:00Z', 'Thunderstorm', 'Texas', 25000],
            ['2025-01-01T12:00:00Z', 'Hail', 'Oklahoma', 15000]
        ],
        rowCount: 3,
        hasData: true,
        executionTime: '245ms'
    },

    // Test the VFS integration
    testAddResult: function(vfs) {
        console.log('Testing VFS add result...');
        
        const resultId = vfs.addQueryResult(
            'StormEvents | where EventType in ("Tornado", "Thunderstorm", "Hail") | take 3',
            this.mockResult,
            'https://help.kusto.windows.net',
            'Samples',
            'test-webview-uri'
        );
        
        console.log(`Result added with ID: ${resultId}`);
        return resultId;
    },

    // Test storage statistics
    testStorageStats: function(vfs) {
        console.log('Testing storage statistics...');
        
        const stats = vfs.getStorageStats();
        console.log('Storage Stats:', {
            mode: stats.mode,
            memoryCount: stats.memoryCount,
            diskCount: stats.diskCount,
            totalSizeMB: stats.totalSizeMB
        });
        
        return stats;
    },

    // Test getting all results
    testGetAllResults: function(vfs) {
        console.log('Testing get all results...');
        
        const results = vfs.getAllResults();
        console.log(`Found ${results.length} results in cache`);
        
        results.forEach((result, index) => {
            console.log(`Result ${index + 1}:`, {
                id: result.id,
                timestamp: result.timestamp,
                rowCount: result.rowCount,
                columnCount: result.columnCount,
                query: result.query.substring(0, 50) + '...'
            });
        });
        
        return results;
    },

    // Run all tests
    runTests: function(vfs) {
        console.log('🧪 Running VFS Tests...\n');
        
        try {
            // Test 1: Add a result
            const resultId = this.testAddResult(vfs);
            console.log('✅ Test 1 passed: Add result\n');
            
            // Test 2: Check storage stats
            const stats = this.testStorageStats(vfs);
            console.log('✅ Test 2 passed: Storage stats\n');
            
            // Test 3: Get all results
            const results = this.testGetAllResults(vfs);
            console.log('✅ Test 3 passed: Get all results\n');
            
            console.log('🎉 All VFS tests completed successfully!');
            
            return {
                success: true,
                resultId,
                stats,
                results
            };
            
        } catch (error) {
            console.error('❌ VFS test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testVFS;
}

// Example usage comment:
/*
// In extension.ts, you could add a test command:
const testVFSCommand = vscode.commands.registerCommand('kustox.testVFS', async () => {
    const testResults = testVFS.runTests(resultsFileSystem);
    if (testResults.success) {
        vscode.window.showInformationMessage('VFS tests passed! Check console for details.');
    } else {
        vscode.window.showErrorMessage(`VFS tests failed: ${testResults.error}`);
    }
});
*/
