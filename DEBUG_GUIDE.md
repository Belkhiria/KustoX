# KustoX Debugging Troubleshooting Guide

## ✅ Issues Fixed

1. **TypeScript Compilation Errors** - Fixed imports and type issues in extension_new.ts
2. **Package.json Main Entry** - Updated to point to extension_new.js (your fixed version)
3. **Launch Configuration** - Added multiple debug configurations
4. **Source Maps** - Enabled for proper debugging experience

## 🚀 How to Debug Your Extension

### Method 1: Using F5 (Recommended)
1. Open VS Code in your KustoX project
2. Press `F5` to start debugging
3. This will automatically compile and launch your extension

### Method 2: Using Run and Debug Panel
1. Open the Run and Debug panel (`Ctrl+Shift+D`)
2. Select one of these configurations:
   - **"Run Extension"** - Standard debugging
   - **"Run Extension (New Version)"** - Enhanced debugging with disabled other extensions
3. Click the green play button

### Method 3: Manual Steps
1. Run `npm run compile` to compile TypeScript
2. Go to Run and Debug panel
3. Select your preferred configuration
4. Start debugging

## 🧪 Testing Your Extension

Once the debug window opens:

### Basic Tests
1. Press `F1` to open Command Palette
2. Type "KustoX" to see your commands:
   - `KustoX: Configure Connection`
   - `KustoX: Create New Kusto File`
   - `KustoX: Hello World`
   - `KustoX: Open KustoX Explorer`

### Connection Test
1. Run `KustoX: Configure Connection`
2. Use these test settings:
   - **Cluster**: `https://help.kusto.windows.net`
   - **Database**: `Samples`
   - **Auth**: Select "Device Code Authentication"

### Query Test
1. Run `KustoX: Create New Kusto File`
2. Try executing this query: `StormEvents | take 5`
3. Press `F5` to execute

## 🐛 Common Issues and Solutions

### Issue: "Cannot find module 'azure-kusto-data'"
**Solution**: Make sure you've installed dependencies
```bash
npm install
```

### Issue: "Extension not loading"
**Solution**: Check the Debug Console for errors
1. In debug window, go to View > Output
2. Select "Log (Extension Host)" from dropdown
3. Look for error messages

### Issue: "TypeScript compilation errors"
**Solution**: Run compilation manually
```bash
npm run compile
```

### Issue: "Authentication failures"
**Solution**: 
1. Use "Device Code Authentication" for testing
2. Make sure you're connected to the internet
3. Try the help cluster: `https://help.kusto.windows.net`

### Issue: "Breakpoints not working"
**Solution**: 
1. Make sure source maps are enabled in launch.json
2. Set breakpoints in `.ts` files, not `.js` files
3. Use "Run Extension (New Version)" configuration

## 🔍 Debug Console Commands

In the Debug Console (bottom panel), you can run:
```javascript
// Check if extension is loaded
vscode.extensions.getExtension('kustox.kustox')

// Check active commands
vscode.commands.getCommands().then(cmds => console.log(cmds.filter(c => c.includes('kustox'))))
```

## 📊 Performance Monitoring

To monitor your extension's performance:
1. Open Debug Console
2. Run: `console.time('myOperation')` before operations
3. Run: `console.timeEnd('myOperation')` after operations

## 🆘 Getting Help

If you still have issues:
1. Check the Debug Console for error messages
2. Look at the Output panel (Log - Extension Host)
3. Check if your TypeScript compiles: `npm run compile`
4. Try the "Run Extension (New Version)" configuration
5. Test with the simple commands first before complex Kusto operations

## 📝 Current Configuration

- **Main Entry**: `./out/extension_new.js` (your fixed version)
- **Source Maps**: Enabled
- **Pre-launch Task**: Automatic compilation
- **Debug Configurations**: 3 available options
- **TypeScript**: Compiling successfully
