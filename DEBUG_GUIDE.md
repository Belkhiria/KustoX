# 🔍 KustoX Debug Logging Guide

## 🎯 **How to See Debug Logs**

### **Method 1: Extension Host Console (Recommended)**
1. **Press F5** to start debug session
2. **In the Extension Development Host window**:
   - Press **F12** → Opens Developer Tools
   - Click **Console** tab
   - See all your `console.log()` statements here

### **Method 2: Debug Console in Main VS Code**
1. **In your main VS Code window** (where you develop):
   - Press **Ctrl+Shift+Y** (or View → Debug Console)
   - See structured debug output here

### **Method 3: Output Panel**
1. **In Extension Development Host**:
   - Press **Ctrl+Shift+U** (or View → Output)
   - Select **"Extension Host"** from dropdown
   - See extension loading/error messages

### **Method 4: VS Code Developer Tools**
1. **In Extension Development Host**:
   - Press **Ctrl+Shift+P**
   - Type: **"Developer: Toggle Developer Tools"**
   - Full Chrome DevTools with Network, Sources, etc.

---

## 📊 **What Logs You'll See**

### **Extension Startup:**
```
KustoX extension is now active!
Loaded table cache with 0 entries
```

### **Connection Logs:**
```
Connecting to database: Samples on cluster: https://help.kusto.windows.net
No existing client found, creating new connection...
Authentication successful
Client authenticated and stored successfully
Connected to Samples on https://help.kusto.windows.net
```

### **Table Discovery:**
```
getChildren called with element: {type: "database"}
Database expanded, discovering tables...
Has client for cluster: true
Discovering tables for database: Samples
Tables discovered: 15
Tables cached for https://help.kusto.windows.net:Samples
```

### **Query Execution:**
```
Executing Kusto query...
Query executed successfully
Results: 150 rows, 8 columns
```

---

## 🚀 How to Debug Your Extension

### Method 1: Using F5 (Recommended)
1. Open VS Code in your KustoX project
2. Press `F5` to start debugging
3. **Immediately press F12** in the new window to see logs
4. This will automatically compile and launch your extension

### Method 2: Using Run and Debug Panel
1. Open the Run and Debug panel (`Ctrl+Shift+D`)
2. Select **"Run Extension"** configuration
3. Click the green play button
4. **Press F12** in Extension Development Host for logs

### Method 3: Manual Steps
1. Run `npm run compile` to compile TypeScript
2. Go to Run and Debug panel
3. Select your preferred configuration
4. Start debugging
5. **Open Console (F12)** to see all extension activity

---

## 🧪 **Step-by-Step Debug Workflow:**

### **1. Start Debug Session**
```
1. Press F5 in main VS Code
2. New "Extension Development Host" window opens
3. Your extension loads automatically
```

### **2. Open Console (MOST IMPORTANT)**
```
In Extension Development Host:
1. Press F12 → Developer Tools
2. Click Console tab
3. All console.log() output appears here
```

### **3. Test Extension Features**
```
1. Add cluster → See connection logs
2. Expand database → See table discovery logs  
3. Run query → See execution logs
4. Any errors → See detailed error messages
```

---

## 🔧 **Enhanced Logging Guide:**

### **Current Logging in Extension:**
- ✅ Connection establishment
- ✅ Table discovery process  
- ✅ Authentication flow
- ✅ Error handling
- ✅ Cache operations
- ✅ Status bar updates
- ✅ Query execution

### **Console Filtering:**
```javascript
// In console, filter by typing:
"KustoX"     // See only extension logs
"error"      // See only errors  
"Tables"     // See table-related logs
"Auth"       // See authentication logs
"Connection" // See connection logs
```

---

## 🧪 Testing Your Extension

Once the debug window opens and **F12 console is open**:

### Basic Tests
1. **Check Console First** - You should see: `"KustoX extension is now active!"`
2. Press `F1` to open Command Palette
3. Type "KustoX" to see your commands:
   - `KustoX: Add Cluster`
   - `KustoX: Show Connection Status` 
   - `KustoX: Copy Results`
   - `KustoX: Copy Chart`

### Connection Test
1. Click the **"+"** icon in Connection Tree view
2. Enter cluster URL (e.g., `https://help.kusto.windows.net`)
3. **Watch Console** for connection logs:
   ```
   No existing client found, creating new connection...
   Authentication successful
   Connected to cluster successfully
   ```

### Table Discovery Test
1. Expand a database in Connection Tree
2. **Watch Console** for table discovery:
   ```
   Database expanded, discovering tables...
   Tables discovered: 15
   Tables cached for cluster:database
   ```

### Query Test
1. Open a `.kql` file
2. Write a simple query: `print "Hello KustoX"`
3. Click **Run** button (should be only one now)
4. **Watch Console** for execution logs:
   ```
   Executing Kusto query...
   Query executed successfully
   Results: 1 rows, 1 columns
   ```

---

## 🚨 **Common Debug Scenarios:**

### **Problem: Extension Not Loading**
**Check:** Debug Console (`Ctrl+Shift+Y`) for activation errors
```
Extension 'kustox' failed to activate
Error: Cannot find module 'azure-kusto-data'
```
**Solution:** Run `npm install` and `npm run compile`

### **Problem: Connection Failing**
**Check:** F12 Console for authentication errors
```
Authentication failed during connection test
Error connecting to database: ETIMEDOUT
```

### **Problem: Tables Not Showing** 
**Check:** F12 Console for discovery issues
```  
Has client for cluster: false
Tables discovered: 0
No tables found for database
```

### **Problem: Two Run Buttons**
**Check:** Should be fixed - only one button in editor title
**If still there:** Clear VS Code cache and reload

### **Problem: Status Bar Not Updating**
**Check:** F12 Console for status updates:
```
Updating connection status to: Connected to Samples
Status bar updated successfully
```

---

## 📋 **Quick Debug Checklist:**

### **✅ Before Debugging:**
1. Run: `npm run compile` 
2. Check no TypeScript errors
3. Press **F5** to start

### **✅ During Debugging:**
1. **Press F12** immediately (most important!)
2. Open Console tab
3. Test features step-by-step
4. Watch for red errors in console

### **✅ After Changes:**
1. **Ctrl+R** in Extension Development Host to reload
2. Or stop debug (Shift+F5) and restart (F5)
3. Clear console to see fresh logs

---

## 🎯 **Pro Debug Tips:**

### **Keyboard Shortcuts:**
- **F5**: Start debugging  
- **F12**: Developer Tools (ESSENTIAL!)
- **Ctrl+Shift+Y**: Debug Console
- **Ctrl+R**: Reload extension window
- **Shift+F5**: Stop debugging

### **Essential Console Commands:**
```javascript
// Clear console
clear()

// Filter logs (type in console filter box)  
"KustoX"     // Extension logs only
"error"      // Errors only
"Connected"  // Connection events
"Tables"     // Table operations
```

### **Breakpoint Debugging:**
1. Set breakpoints in VS Code source (.ts files)
2. F5 to debug → Code stops at breakpoints
3. Inspect variables in Debug panel
4. Step through code line-by-line
5. Much more powerful than console.log!

---

## 🚀 **Ready to Debug!**

**Essential 3-Step Workflow:**
1. **Press F5** → Start debug session
2. **Press F12** → Open console in Extension Development Host  
3. **Test features** → Watch logs appear in real-time

**The F12 console shows you EVERYTHING the extension does!** 🔍

This is where you'll see all connection attempts, table discoveries, query executions, errors, and status updates. It's your window into what's happening inside the extension.
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
