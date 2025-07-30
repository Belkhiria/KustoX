# Table Discovery Debugging Guide

## 🐛 Problem: Tables not showing when expanding databases

## 🧪 How to Test and Debug:

### Step 1: Enable Console Logging
1. Press **F5** to run extension in debug mode
2. Press **F12** in the test window to open Developer Tools
3. Go to **Console** tab

### Step 2: Test the Table Discovery
1. **Add a cluster** (+ button): `https://help.kusto.windows.net`
2. **Expand the cluster** by clicking the arrow
3. **Try to expand a database** (e.g., "Samples") by clicking its arrow
4. **Watch the console** for debug messages

### Step 3: Expected Console Output
When you expand a database, you should see:
```
getChildren called with element: {type: "database", name: "Samples", ...}
Getting children for item type: database
Database expanded, discovering tables...
Database details - cluster: https://help.kusto.windows.net database: Samples
Discovering tables for database: Samples on cluster: https://help.kusto.windows.net
Client found, executing .show tables query...
Tables query results: [object Object]
Primary results available: true
Primary results length: 1
Processing table rows...
Row 1: [object Object]
Extracted table name: StormEvents
Row 2: [object Object]
Extracted table name: ...
Total tables discovered: X
Returning tables: ["StormEvents", "ContosoSales", ...]
```

### Step 4: Common Issues and Solutions

#### Issue 1: "No client found for cluster"
**Problem**: The authenticated client isn't stored properly
**Solution**: 
- Remove and re-add the cluster
- Make sure you complete the authentication flow

#### Issue 2: "Primary results available: false"
**Problem**: The `.show tables` query failed or returned no results
**Possible causes**:
- No permission to list tables
- Database doesn't exist or is empty
- Authentication expired

#### Issue 3: "getChildren called with element: undefined"
**Problem**: Database expansion isn't triggering correctly
**Solution**: 
- Make sure databases have `vscode.TreeItemCollapsibleState.Collapsed`
- Check that databases are showing up as expandable (with arrows)

#### Issue 4: Tables discovered but not showing in tree
**Problem**: TreeItem creation or rendering issue
**Check**: Look for errors after "Returning tables:" in console

### Step 5: Manual Table Query Test
If table discovery isn't working, test manually:
1. Connect to the database (click on it)
2. Create a `.kql` file
3. Run this query: `.show tables`
4. Check if you get results

### Step 6: Expected Tree Structure
After expansion, you should see:
```
📁 EXPLORER
└── 🌳 Kusto Clusters
    └── 🖥️ https://help.kusto.windows.net
        └── 🗄️ Samples                    ← Click arrow to expand
            ├── 📋 StormEvents             ← Tables should appear here
            ├── 📋 ContosoSales
            ├── 📋 SampleHTTPReqs
            └── 📋 ...
```

### Step 7: Table Actions
Once tables are visible, you should be able to:
- **Click table name** → Inserts table name into active .kql file
- **Right-click table** → Context menu with "Insert Table Name"

## 🔧 Debug Commands to Try:

In VS Code Command Palette (`Ctrl+Shift+P`):
- `Developer: Reload Window` - Reload if tree gets stuck
- `Developer: Toggle Developer Tools` - Open console for debugging

## 🚨 If Still Not Working:

1. **Check Authentication**: Make sure you can run queries manually
2. **Check Permissions**: Verify you can see tables in Kusto Explorer or Azure portal
3. **Try Different Database**: Some databases might be empty or restricted
4. **Check Console Errors**: Look for red error messages in console

The extensive logging should help identify exactly where the table discovery is failing!
