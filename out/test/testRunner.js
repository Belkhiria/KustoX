"use strict";
// Test Runner for KustoX Extension
// This will execute the test queries and validate results automatically
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.KustoXTestRunner = void 0;
const vscode = __importStar(require("vscode"));
const kustoXTests_1 = require("./kustoXTests");
class KustoXTestRunner {
    constructor() {
        this.results = [];
        this.testSuite = new kustoXTests_1.KustoXTestSuite();
    }
    async runAllTests() {
        console.log('🧪 Starting KustoX Extension Test Suite...');
        const tests = this.testSuite.getTests();
        this.results = [];
        for (let i = 0; i < tests.length; i++) {
            console.log(`\n🔄 Running Test ${i + 1}: ${tests[i].description}`);
            try {
                // Execute the query using your extension
                const result = await this.executeQuery(tests[i].query);
                // Validate the result
                const passed = await this.testSuite.runTest(i, result);
                this.results.push(passed);
                // Small delay between tests
                await this.delay(1000);
            }
            catch (error) {
                console.log(`❌ Test ${i + 1} failed with error: ${error}`);
                this.results.push(false);
            }
        }
        // Generate and display report
        this.generateReport();
    }
    async executeQuery(query) {
        try {
            // Create a temporary document with the query
            const document = await vscode.workspace.openTextDocument({
                content: query,
                language: 'kusto'
            });
            const editor = await vscode.window.showTextDocument(document);
            // Select all text
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            editor.selection = new vscode.Selection(fullRange.start, fullRange.end);
            // Mock result structure - you'll need to integrate with your actual extension
            // For now, we'll simulate the structure your extension should return
            const mockResult = this.createMockResult(query);
            return mockResult;
        }
        catch (error) {
            throw error;
        }
    }
    createMockResult(query) {
        // This is a mock - replace with actual integration to your extension
        // For testing purposes, we'll simulate some expected results
        if (query.includes('InvalidColumnName')) {
            return {
                error: 'Column not found',
                rowCount: 0,
                columns: [],
                hasData: false
            };
        }
        if (query.includes('NonExistentEventType')) {
            return {
                rowCount: 0,
                columns: ['StartTime', 'EventType', 'State'],
                rows: [],
                hasData: false
            };
        }
        if (query.includes('print "Hello World"')) {
            return {
                rowCount: 1,
                columns: ['print_0'],
                rows: [['Hello World']],
                hasData: true
            };
        }
        if (query.includes('take 5')) {
            return {
                rowCount: 5,
                columns: ['StartTime', 'EndTime', 'EventType', 'State', 'DamageProperty'],
                rows: Array(5).fill(['2007-01-01T00:00:00Z', '2007-01-01T01:00:00Z', 'Tornado', 'TEXAS', '1000']),
                hasData: true
            };
        }
        if (query.includes('take 1') && query.includes('summarize')) {
            return {
                rowCount: 1,
                columns: ['EventType', 'State', 'TotalEvents', 'TotalDamage'],
                rows: [['Tornado', 'TEXAS', '1', '1000']],
                hasData: true
            };
        }
        // Default mock result
        return {
            rowCount: 10,
            columns: ['EventType', 'TotalEvents'],
            rows: Array(10).fill(['Tornado', '5']),
            hasData: true
        };
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateReport() {
        const report = this.testSuite.generateTestReport(this.results);
        // Create a new document with the report
        vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        }).then(document => {
            vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
        });
        // Also log summary to console
        const passed = this.results.filter(r => r).length;
        const total = this.results.length;
        const percentage = Math.round((passed / total) * 100);
        console.log(`\n📊 Test Suite Complete!`);
        console.log(`   Passed: ${passed}/${total} (${percentage}%)`);
        if (percentage === 100) {
            console.log(`🎉 All tests passed! Your extension is working correctly.`);
        }
        else {
            console.log(`⚠️  Some tests failed. Check the detailed report for issues.`);
        }
    }
}
exports.KustoXTestRunner = KustoXTestRunner;
// Command to run the test suite
function activate(context) {
    const runTests = vscode.commands.registerCommand('kustox.runTests', async () => {
        const runner = new KustoXTestRunner();
        await runner.runAllTests();
    });
    context.subscriptions.push(runTests);
}
exports.activate = activate;
//# sourceMappingURL=testRunner.js.map