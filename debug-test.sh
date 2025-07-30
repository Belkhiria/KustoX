#!/bin/bash

# KustoX Debug Test Script
echo "🔧 KustoX Debug Setup Test"
echo "=========================="

# Check if compiled files exist
echo "📦 Checking compiled files..."
if [ -f "out/extension.js" ]; then
    echo "✅ extension.js exists"
else
    echo "❌ extension.js missing"
fi

if [ -f "out/extension_new.js" ]; then
    echo "✅ extension_new.js exists (your fixed version)"
else
    echo "❌ extension_new.js missing"
fi

# Check package.json main entry
echo ""
echo "📋 Checking package.json main entry:"
grep '"main":' package.json

# Check for TypeScript errors
echo ""
echo "🔍 Checking for TypeScript errors..."
npm run compile
COMPILE_EXIT_CODE=$?

if [ $COMPILE_EXIT_CODE -eq 0 ]; then
    echo "✅ Compilation successful"
else
    echo "❌ Compilation failed"
fi

# Check VS Code configuration
echo ""
echo "⚙️ Checking VS Code configuration:"
if [ -f ".vscode/launch.json" ]; then
    echo "✅ launch.json exists"
    echo "Available debug configurations:"
    grep '"name":' .vscode/launch.json | sed 's/.*"name": *"\([^"]*\)".*/  - \1/'
else
    echo "❌ launch.json missing"
fi

if [ -f ".vscode/tasks.json" ]; then
    echo "✅ tasks.json exists"
else
    echo "❌ tasks.json missing"
fi

echo ""
echo "🚀 Ready to debug!"
echo "==================="
echo "1. Press F5 to start debugging"
echo "2. Or go to Run and Debug panel (Ctrl+Shift+D)"
echo "3. Select 'Run Extension' or 'Run Extension (New Version)'"
echo "4. Click the green play button"
echo ""
echo "🎯 Your extension will open in a new VS Code window"
echo "🧪 Test commands:"
echo "   - Press F1 and type 'KustoX'"
echo "   - Try 'KustoX: Configure Connection'"
echo "   - Try 'KustoX: Create New Kusto File'"
