# Connection Tree - Kusto Explorer-like Experience

## Overview

The KustoX Connection Tree provides a familiar interface similar to Kusto Explorer, allowing you to manage multiple Kusto clusters and databases directly from VS Code's Explorer panel.

## Features

### 🌳 Tree View Structure
- **Clusters**: Top-level items representing Kusto cluster connections
- **Databases**: Child items showing available databases in each cluster
- **Icons**: Visual indicators (server icon for clusters, database icon for databases)

### 🔌 Connection Management
- **Add Cluster**: Connect to new Kusto clusters with automatic database discovery
- **Auto-Discovery**: Automatically fetch and display all available databases
- **Remove Cluster**: Clean removal of cluster connections
- **Refresh**: Update the tree view with latest cluster information

### 🔐 Authentication
- **Azure Identity Integration**: Seamless authentication using Azure Device Code flow
- **Automatic Token Management**: Handles authentication tokens automatically
- **Multi-Cluster Support**: Connect to multiple clusters simultaneously

## Usage

### Adding a New Cluster

1. **Open the Connection Tree**
   - Look for "Kusto Clusters" in the VS Code Explorer panel
   - If not visible, ensure the KustoX extension is activated

2. **Add Cluster Button**
   - Click the "+" (Add Cluster) button in the tree view title
   - Or use Command Palette: `KustoX: Add Cluster`

3. **Enter Cluster URL**
   ```
   https://your-cluster.kusto.windows.net
   ```
   - The extension validates the URL format
   - Supports both full URLs and shorthand formats

4. **Authentication Flow**
   - The extension will initiate Azure Device Code authentication
   - Follow the prompts to sign in with your Azure credentials
   - Databases will be automatically discovered and displayed

### Connecting to a Database

1. **Expand Cluster**
   - Click the arrow next to a cluster to see its databases

2. **Click Database**
   - Click on any database name to connect
   - The extension will establish a connection for query execution

3. **Visual Feedback**
   - Success message confirms the connection
   - The database becomes the active context for queries

### Managing Connections

#### Refresh Connections
- Click the refresh button (🔄) in the tree view title
- Updates the tree with current cluster information

#### Remove Cluster
- Right-click on a cluster → "Remove Cluster"
- Confirmation dialog prevents accidental removal

#### Copy Connection String
- Right-click on cluster or database → "Copy Connection String"
- Copies the connection details to clipboard

## Tree View Commands

### Title Bar Commands
| Command | Icon | Description |
|---------|------|-------------|
| Add Cluster | + | Add a new Kusto cluster connection |
| Refresh | 🔄 | Refresh the connection tree |

### Context Menu Commands
| Item Type | Command | Description |
|-----------|---------|-------------|
| Cluster | Remove Cluster | Remove the cluster from the tree |
| Cluster | Copy Connection String | Copy cluster URL to clipboard |
| Database | Connect to Database | Set as active database for queries |
| Database | Copy Connection String | Copy cluster/database path to clipboard |

## Integration with Query Execution

### Automatic Context
- When you connect to a database via the tree, it becomes the default context
- All subsequent queries will execute against the selected database
- No need to manually configure connections in query files

### Seamless Workflow
1. Add cluster to tree
2. Click database to connect
3. Create/open .kql file
4. Execute queries with F5 or Run button

## Authentication Details

### Azure Device Code Flow
```typescript
// The extension uses Azure Device Code authentication
const kcsb = KustoConnectionStringBuilder.withAadDeviceAuthentication(clusterUrl);
const client = new KustoClient(kcsb);
```

### Benefits
- **No Client ID Required**: Uses Microsoft's public client registration
- **Multi-Factor Authentication**: Supports MFA and conditional access policies
- **Token Caching**: Automatically handles token refresh
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Storage and Persistence

### Connection Persistence
- Cluster connections are saved in VS Code's global state
- Persists across VS Code sessions and restarts
- No sensitive data stored locally (tokens handled by Azure SDK)

### Data Structure
```typescript
interface ConnectionItem {
    type: 'cluster' | database';
    name: string;
    cluster?: string;
    database?: string;
    children?: ConnectionItem[];
}
```

## Error Handling

### Connection Errors
- **Invalid URL**: Validation prevents malformed cluster URLs
- **Authentication Failure**: Clear error messages guide users to re-authenticate
- **Network Issues**: Graceful handling of connectivity problems
- **Permission Errors**: Informative messages about access rights

### User Feedback
- Success notifications for successful operations
- Warning dialogs for destructive actions (remove cluster)
- Error messages with actionable guidance

## Tips and Best Practices

### 🎯 Cluster URL Formats
```
✅ https://mycluster.kusto.windows.net
✅ mycluster.kusto.windows.net (auto-adds https://)
❌ Invalid formats will be caught by validation
```

### 🔄 Managing Multiple Clusters
- Add dev, staging, and production clusters
- Use descriptive cluster names for easy identification
- Remove unused clusters to keep the tree clean

### 🚀 Performance Optimization
- Database discovery happens once per cluster add
- Tree refresh updates without re-authenticating
- Minimal network calls for tree operations

### 🔐 Security Considerations
- Always use HTTPS cluster URLs
- Regularly refresh authentication tokens
- Remove unused cluster connections

## Troubleshooting

### Common Issues

#### "Failed to add cluster"
- Verify cluster URL is correct and accessible
- Check your Azure credentials and permissions
- Ensure network connectivity to the cluster

#### "Authentication required"
- Complete the device code authentication flow
- Check if authentication tokens have expired
- Try refreshing the connection tree

#### "No databases found"
- Verify you have read permissions on the cluster
- Some clusters may not show system databases
- Contact your cluster administrator for access

### Getting Help
- Check the VS Code Developer Console for detailed error logs
- Use the refresh button to retry failed operations
- Refer to the main KustoX documentation for additional support

## Future Enhancements

### Planned Features
- 🔄 **Background Refresh**: Automatic periodic refresh of database lists
- 📊 **Database Metadata**: Show table counts and size information
- 🏷️ **Connection Labels**: Custom names for cluster connections
- 🔍 **Search and Filter**: Find specific clusters or databases quickly
- 📁 **Connection Groups**: Organize connections by environment or project

### Community Requests
We welcome feedback and feature requests! Common requests include:
- Import/export connection configurations
- Integration with Azure Resource Manager
- Support for on-premises Kusto installations
- Advanced authentication methods (certificate-based, managed identity)

---

The Connection Tree brings the familiar Kusto Explorer experience directly into VS Code, making it easier than ever to manage your data exploration workflow. Start by adding your first cluster and discover how seamless Kusto development can be!
