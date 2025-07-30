# Quick Start Guide - Connection Tree

## Step 1: Open the Connection Tree
1. Open VS Code with the KustoX extension
2. Look for "**Kusto Clusters**" in the Explorer panel (left sidebar)
3. If you don't see it, press `Ctrl+Shift+E` to open the Explorer

## Step 2: Add Your First Cluster
1. Click the **"+"** button in the "Kusto Clusters" section
2. Enter your cluster URL, for example:
   ```
   https://help.kusto.windows.net
   ```
3. The extension will automatically:
   - Authenticate with Azure (follow the device code flow)
   - Discover all databases in the cluster
   - Show them in the tree view

## Step 3: Connect to a Database
1. Expand the cluster by clicking the arrow
2. Click on any database name (e.g., "Samples")
3. You'll see a success message confirming the connection

## Step 4: Execute Queries
1. Create a new `.kql` file or open an existing one
2. Write your Kusto query
3. Press `F5` or click the Run button
4. Results will appear with charts and tables automatically

## Alternative: Use Configure Connection
If you prefer the traditional approach:
1. Use `Ctrl+Shift+P` → "KustoX: Configure Connection"
2. Enter cluster URL and database name
3. The cluster will **automatically be added to the tree view**

## Troubleshooting
- **Tree not visible?** Check the Explorer panel is open (`Ctrl+Shift+E`)
- **Authentication issues?** Try refreshing the tree view with the refresh button
- **No databases showing?** Verify you have read permissions on the cluster

## Visual Guide
```
📁 EXPLORER
├── 🗂️ Your Project Files
└── 🌳 Kusto Clusters
    ├── 🖥️ https://help.kusto.windows.net
    │   ├── 🗄️ Samples      ← Click to connect
    │   ├── 🗄️ SampleLogs
    │   └── 🗄️ ContosoSales
    └── ➕ Add Cluster      ← Click to add new cluster
```

That's it! You now have the full Kusto Explorer experience directly in VS Code.
