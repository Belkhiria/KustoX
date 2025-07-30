# Connection Tree Troubleshooting

## ❌ Problem: Can't see the "+" button or connection tree

## ✅ Solutions Applied:

### 1. Fixed Authentication Method
**Problem**: `withAadDeviceAuthentication` was hanging
**Solution**: Changed to `withUserPrompt` (opens browser automatically)

### 2. Added Progress Indication
**Problem**: No feedback during connection
**Solution**: Added progress bar with 30-second timeout

### 3. Made View Always Visible
**Problem**: Empty tree view was hidden
**Solution**: Added welcome message and set `visibility: "visible"`

## 🧪 How to Test:

### Step 1: Run Extension
1. Press `F5` to start debug session
2. New VS Code window opens

### Step 2: Find the Tree View
1. Press `Ctrl+Shift+E` (Explorer panel)
2. Scroll down to find "**Kusto Clusters**" section
3. You should see: "Click + to add your first cluster"

### Step 3: Try Adding Cluster
**Option A: Use the + button**
- Look for + button in the "Kusto Clusters" title bar
- Click it and enter: `https://help.kusto.windows.net`

**Option B: Use Command Palette**
1. Press `Ctrl+Shift+P`
2. Type: `KustoX: Add Cluster`
3. Enter: `https://help.kusto.windows.net`

### Step 4: Authenticate
- Browser window should open automatically
- Sign in with your Azure account
- Close browser when done

### Step 5: Verify Tree Population
- Tree should show databases under the cluster
- Click any database to connect
- Success message should appear

## 🚨 If Still Not Working:

### Check Extension is Loaded
1. Press `Ctrl+Shift+P`
2. Type "KustoX" - you should see commands
3. If not, extension didn't load properly

### Force View Visibility
1. Right-click in Explorer panel
2. Look for "Kusto Clusters" in context menu
3. Make sure it's checked

### Check Console for Errors
1. Press `F12` (Developer Tools)
2. Look in Console tab
3. Look for red error messages

## 📋 Expected Final Result:
```
📁 EXPLORER
├── 📁 Your Files
└── 🌳 Kusto Clusters               ← Should be here
    ├── 🖥️ help.kusto.windows.net
    │   ├── 🗄️ Samples             ← Click to connect
    │   ├── 🗄️ ContosoSales
    │   └── 🗄️ SampleLogs
    └── ➕ Add Cluster              ← Button should be here
```

If you still don't see this, let me know what you see instead!
