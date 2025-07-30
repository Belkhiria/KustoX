#!/bin/bash

# KustoX Test Runner Script
# Quick way to test your extension functionality

echo "🚀 KustoX Test Runner"
echo "===================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in KustoX project directory"
    echo "Please run this script from the KustoX root directory"
    exit 1
fi

# Compile the extension
echo "📦 Compiling extension..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"
echo ""

# Show available commands
echo "📋 Available test commands in VS Code:"
echo ""
echo "1. KustoX: Run Integration Tests"
echo "   - Basic integration tests that validate extension commands"
echo ""
echo "2. KustoX: Run Comprehensive Tests" 
echo "   - Detailed validation of query results and functionality"
echo "   - Tests the original multi-line query issue"
echo "   - Validates error handling and edge cases"
echo ""
echo "📝 To run tests:"
echo "1. Open VS Code: code ."
echo "2. Press F1 and type 'KustoX: Run Comprehensive Tests'"
echo "3. Or use Command Palette (Ctrl+Shift+P) and search for 'KustoX'"
echo ""
echo "🔧 Prerequisites:"
echo "- Configure your Kusto connection first using 'KustoX: Configure Connection'"
echo "- Use cluster: https://help.kusto.windows.net"
echo "- Use database: Samples"
echo "- Authentication: Interactive Browser (recommended)"
echo ""

# Check if VS Code is available
if command -v code &> /dev/null; then
    echo "💡 Quick start: Opening VS Code..."
    code .
else
    echo "⚠️  VS Code 'code' command not found in PATH"
    echo "   Please open VS Code manually in this directory"
fi

echo ""
echo "🎯 Test focus areas:"
echo "- Multi-line query processing (your original issue)"
echo "- Result row count accuracy"  
echo "- Column name extraction"
echo "- Error handling"
echo "- Large result sets"
echo "- Empty result handling"
echo ""
echo "Happy testing! 🧪"
