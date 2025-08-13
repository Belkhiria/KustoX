# KustoX - Modern Kusto Explorer

KustoX is a powerful Visual Studio Code extension designed to modernize and simplify your data exploration workflow with AI capabilities. Effortlessly write, run, and visualize queries with an intuitive interface—bringing the best of Kusto Explorer directly into VS Code.

## ✨ Key Features

### 🤖 AI Integration (New!)
- **Virtual File System**: Query results accessible to AI agents like Copilot Studio
- **Multiple Formats**: JSON, CSV, Markdown, and AI-optimized data exports
- **Dual Analysis**: Visual tables for humans + structured data for AI
- **Smart Context**: AI gets query metadata, schema, and analysis hints
- **Configurable Storage**: Memory, disk, or hybrid persistence modes

### 🌳 Connection Tree
- **Kusto Explorer-like Interface**: Familiar tree view for managing clusters and databases
- **Auto-Discovery**: Automatically detect and display all available databases
- **Azure Authentication**: Seamless integration with Azure identity for secure connections
- **One-Click Connection**: Click any database to instantly connect and start querying

### 🎨 Advanced Syntax Highlighting
- **Complete KQL Grammar**: Comprehensive TextMate grammar for all Kusto constructs
- **Smart IntelliSense**: Context-aware autocompletion for functions, operators, and keywords
- **Custom Theme**: Optimized color scheme for better code readability
- **30+ Code Snippets**: Quick insertion of common query patterns

### 📊 Rich Visualizations
- **Chart Support**: Automatic detection and rendering of `render` commands
- **7 Chart Types**: Column, bar, pie, line, area, time, and scatter plots
- **Tabbed Interface**: Switch between chart and table views seamlessly
- **Chart.js Integration**: Professional-quality visualizations

### 🚨 Enhanced Error Reporting
- **Detailed Error Parsing**: No more generic "HTTP 400" errors
- **Kusto-Specific Messages**: Precise error locations and suggestions
- **Troubleshooting Tips**: Built-in guidance for common query issues

## 🚀 Quick Start

### 1. Install the Extension
```bash
# From VS Code Marketplace or
code --install-extension kustox
```

### 2. Add Your First Cluster
1. Open the **Explorer** panel in VS Code
2. Look for the **"Kusto Clusters"** tree view
3. Click the **"+"** button to add a cluster
4. Enter your cluster URL: `https://your-cluster.kusto.windows.net`
5. Authenticate with Azure when prompted

### 3. Connect and Query
1. Expand your cluster in the tree view
2. Click on any database to connect
3. Create a new `.kql` file or use **"KustoX: Create New Kusto File"**
4. Press **F5** or click **Run** to execute queries

## 🤖 AI Integration

KustoX automatically makes query results accessible to AI agents while preserving the visual table experience:

### How It Works
1. **Execute queries normally** - results appear in beautiful visual tables/charts
2. **AI gets structured access** - data is simultaneously cached in Virtual File System
3. **Multiple formats available** - JSON, CSV, Markdown, and AI-optimized exports
4. **Best of both worlds** - humans use visual tools, AI analyzes structured data

### AI Commands
- **Analyze with AI** - Access AI analysis options for query results
- **Open Results Explorer** - Browse the Virtual File System
- **Export for AI** - Get AI-optimized data format
- **Storage Stats** - View cache statistics and configuration

### Configuration
```json
{
  "kustox.results.storageMode": "hybrid",
  "kustox.results.maxMemoryResults": 100,
  "kustox.results.retentionDays": 30
}
```

**Storage Modes:**
- `memory` - Temporary, fast access
- `disk` - Persistent, survives restarts  
- `hybrid` - Memory cache + disk backup (recommended)

For detailed AI integration documentation, see [AI-INTEGRATION.md](./AI-INTEGRATION.md).

## 📋 Example Queries

```kusto
// Basic data exploration
StormEvents
| take 10

// Aggregation with visualization
StormEvents
| where EventType == "Tornado"
| summarize EventCount = count() by State
| top 10 by EventCount
| render columnchart

// Time series analysis
StormEvents
| where EventType == "Tornado" 
| summarize EventCount = count() by bin(StartTime, 30d)
| render timechart
```

## 🎯 Connection Management

### Adding Clusters
- **Validation**: Automatic URL format validation
- **Authentication**: Azure Device Code flow for secure access
- **Database Discovery**: Automatic enumeration of available databases

### Managing Connections
- **Persistent Storage**: Connections saved across VS Code sessions
- **Easy Removal**: Right-click to remove unused clusters
- **Copy Connection Strings**: Quick access to connection details

## 📚 Documentation

- **[Connection Tree Guide](CONNECTION_TREE.md)**: Comprehensive guide to cluster management
- **[Syntax Highlighting](SYNTAX_HIGHLIGHTING.md)**: Details about KQL language support
- **[Error Reporting](ERROR_REPORTING.md)**: Understanding enhanced error messages
- **[Chart Visualization](CHART_VISUALIZATION.md)**: Working with data visualizations

## 🛠️ Development

### Prerequisites
- Node.js 18+
- VS Code Extension Development tools

### Setup
```bash
git clone https://github.com/Belkhiria/KustoX.git
cd KustoX
npm install
npm run compile
```

### Testing
```bash
# Run all tests
npm test

# Compile and watch for changes
npm run watch
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to get started.

### Areas for Contribution
- Additional chart types and visualization options
- Enhanced IntelliSense and autocomplete features
- Performance optimizations for large datasets
- Additional authentication methods
- Improved error handling and user experience

## 📄 License

**KustoX uses dual licensing:**

- **Open Source**: Licensed under AGPL-3.0 for community use - see the [LICENSE](LICENSE) file for details
- **Commercial**: Commercial licenses available for proprietary use

### 🔒 Important for Contributors
- **Fork Required**: You must fork this repository (not clone directly) to contribute
- **Open Source Requirement**: All derivative works must remain open source under AGPL-3.0 unless you purchase a commercial license
- **Commercial Licensing**: Contact the maintainer for commercial licensing options

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🔗 Links

- **[GitHub Repository](https://github.com/Belkhiria/KustoX)**
- **[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=kustox.kustox)**
- **[Issue Tracker](https://github.com/Belkhiria/KustoX/issues)**

---

**Made with ❤️ for the Kusto community**

Transform your data exploration experience with KustoX - the modern way to work with Kusto in VS Code!
