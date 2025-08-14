# KustoX - Modern Kusto Explorer & Microsoft Fabric 🚀 (BETA)

**🚧 BETA RELEASE: The most advanced Visual Studio Code extension for Azure Data Explorer/Kusto and Microsoft Fabric Eventhouse with revolutionary unified AAD authentication and AI integration**

> ⚠️ **This is a BETA release** - Early access to cutting-edge features. Please test thoroughly and [provide feedback](https://github.com/Belkhiria/KustoX/issues).

[![Version](https://img.shields.io/badge/version-0.2.2--beta-orange.svg)](https://marketplace.visualstudio.com/items?itemName=kustox.kustox)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![AI-Powered](https://img.shields.io/badge/AI-Powered%20VFS-purple.svg)](#-revolutionary-ai-integration)
[![Fabric](https://img.shields.io/badge/Microsoft-Fabric-blue.svg)](#-unified-authentication-new)
[![Beta](https://img.shields.io/badge/status-BETA-orange.svg)](#-beta-features-early-access)
[![Downloads](https://img.shields.io/badge/downloads-1K+-brightgreen.svg)](https://marketplace.visualstudio.com/items?itemName=kustox.kustox)

> 🌟 **NEW in v0.2.2-beta**: Revolutionary unified AAD authentication with automatic MFA support!
> 
> **Experience seamless connectivity** - Single authentication method for Azure Data Explorer clusters and Microsoft Fabric Eventhouse databases

---

**KustoX transforms your data exploration workflow with unified support for both Azure Data Explorer and Microsoft Fabric Eventhouse. Effortlessly write, run, and visualize KQL queries with an intuitive interface—bringing the best of both platforms directly into VS Code.**

## 🚧 Beta Features (Early Access)

### 🔐 Unified AAD Authentication (NEW!)
- **Universal connectivity** - Single authentication method for Azure Data Explorer clusters and Microsoft Fabric Eventhouse databases
- **Automatic MFA support** - Seamless multi-factor authentication handling through modern `withUserPrompt()` method
- **Silent authentication mode** - Background token refresh for uninterrupted workflow
- **Enhanced reliability** - Upgraded to latest Azure SDK (azure-kusto-data 7.0.1, azure-kusto-ingest 7.0.1)
- **Breaking change**: Replaces complex legacy authentication paths with modern unified approach

### ⚠️ Beta Disclaimer
This beta release includes experimental authentication improvements. While thoroughly tested, please:
- Test authentication in your environment before production use
- Keep existing Kusto tools available as backup during beta testing
- [Report any issues](https://github.com/Belkhiria/KustoX/issues) to help improve the stable release
- Provide feedback on the new unified authentication experience

---

## 🎉 What's New in v0.2.2-beta

## � What's New in v0.2.2-beta

### 🔐 Revolutionary Unified Authentication 
- **Single authentication method** - Unified `AuthenticationManager` handles all Azure scenarios
- **Automatic MFA support** - Modern `withUserPrompt()` method for seamless multi-factor authentication
- **Silent authentication mode** - Background token refresh prevents workflow interruptions
- **Enhanced compatibility** - Works with both Azure Data Explorer clusters and Fabric Eventhouse
- **Upgraded Azure SDK** - Latest azure-kusto-data 7.0.1 and azure-kusto-ingest 7.0.1 for maximum reliability

### ⚡ Improved Reliability & Performance
- **Simplified connection flow** - Single unified method replaces complex legacy authentication paths
- **Better error handling** - Comprehensive authentication error messages and recovery guidance
- **Modern token management** - Automatic token refresh and expiration handling
- **Corporate environment support** - Enhanced compatibility with enterprise AAD configurations

### � Beta Testing Features
- **Comprehensive testing guide** - Detailed authentication testing instructions included
- **Feedback collection system** - Easy issue reporting and feature request submission
- **Performance monitoring** - Built-in diagnostics for authentication flow optimization
- **Backward compatibility** - Graceful fallback for edge cases during beta period

---

**Transform your data exploration with the power of AI-enhanced Kusto querying!**

---

KustoX is a powerful Visual Studio Code extension designed to modernize and simplify your data exploration workflow with AI capabilities. Effortlessly write, run, and visualize queries with an intuitive interface—bringing the best of Kusto Explorer directly into VS Code.

## ✨ Key Features

### 🤖 Revolutionary AI Integration
- **Virtual File System (VFS)**: Industry-first `kustox-ai://` scheme for real-time AI access to query results
- **Dual-Access Architecture**: Visual tables for humans + structured data for AI simultaneously
- **ML Training System**: AI learns from your query patterns to provide intelligent suggestions
- **Copilot Chat Integration**: Dedicated `@kustox` participant with deep contextual understanding
- **Multiple Export Formats**: JSON, CSV, Markdown, and AI-optimized data exports
- **Zero Compromise**: Beautiful visualizations AND AI capabilities without choosing sides

### 🎯 Advanced Query Execution
- **Smart Results Management**: Automatic tab prioritization (JSON focus, HTML background)
- **Real-time Visualization**: Rich tables, charts, and interactive dashboards
- **VFS Explorer**: Browse and manage AI-accessible query results
- **Performance Optimization**: Configurable caching with memory/disk hybrid storage
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

## 🚀 Quick Start (Beta Installation)

### 1. Install the Beta Extension
**Option A: Direct VSIX Installation (Recommended for Beta)**
```bash
# Download kustox-0.2.2-beta.vsix from releases and install
code --install-extension kustox-0.2.2-beta.vsix
```

**Option B: From VS Code Marketplace (when available)**
```bash
code --install-extension kustox
```

> ⚠️ **Beta Notice**: This beta version includes experimental unified authentication. Keep your existing Kusto tools available as backup during testing.

### 2. Add Your First Cluster (Enhanced Authentication)
1. Open the **Explorer** panel in VS Code
2. Look for the **"Kusto Clusters"** tree view
3. Click the **"+"** button to add a cluster
4. Enter your cluster URL: 
   - Azure Data Explorer: `https://your-cluster.kusto.windows.net`
   - Fabric Eventhouse: `https://your-workspace.kusto.fabric.microsoft.com`
5. **NEW**: Experience seamless unified AAD authentication with automatic MFA support

### 3. Connect and Query (Beta Features)
1. Expand your cluster in the tree view
2. Click on any database to connect (enjoy faster, more reliable authentication!)
3. Create a new `.kql` file or use **"KustoX: Create New Kusto File"**
4. Press **F5** or click **Run** to execute queries
5. **Beta Feedback**: [Report any authentication issues](https://github.com/Belkhiria/KustoX/issues) to help improve the stable release

## 🤖 Revolutionary AI Integration

KustoX introduces **industry-first Virtual File System (VFS)** technology that bridges the gap between human data exploration and AI analysis - giving you the best of both worlds without compromise.

### 🚀 Why KustoX VFS is Revolutionary

**🔄 Dual-Access Architecture**
- **Humans see beautiful visualizations** - Rich tables, charts, and interactive dashboards  
- **AI gets structured data access** - Real-time access via `kustox-ai://results/` scheme
- **Zero compromise** - No choosing between visual experience or AI capabilities

**⚡ Real-Time AI Access**
- **Instant availability** - Query results immediately accessible to AI agents
- **Multiple formats** - JSON, CSV, Markdown, and AI-optimized exports  
- **Live updates** - AI sees results as you execute queries
- **Smart caching** - Efficient storage with configurable retention

**🧠 AI Training System (Foundation Ready)**
- **Architecture in place** - Ready for ML models to learn from query patterns
- **Data collection framework** - Infrastructure prepared for pattern analysis
- **Copilot integration ready** - Framework prepared for chat participant implementation
- **Extensible design** - Built to support future AI enhancements

### How It Works
1. **Execute queries normally** - Results appear in beautiful visual tables/charts
2. **VFS creates AI bridge** - Data simultaneously available at `kustox-ai://results/latest.json`
3. **AI agents connect instantly** - GitHub Copilot, Copilot Chat, and custom AI tools get immediate access
4. **Training system learns** - Your query patterns improve AI suggestions over time
5. **Enhanced workflow** - AI provides insights while you maintain full visual control

### 🎯 AI Commands & Features (Available Now)
- **VFS Toggle** - `KustoX: Toggle VFS Status` to enable/disable Virtual File System
- **Results Access** - Query results automatically available at `kustox-ai://results/latest.json`
- **Multi-Format Export** - JSON, CSV, Markdown, and AI-optimized data formats
- **VFS Explorer** - Browse Virtual File System contents via command palette
- **AI-Friendly Structure** - Results formatted for optimal AI consumption

### 🚀 Coming Soon (v0.3.0)
- **KustoX Chat Participant** - Dedicated `@kustox` agent in Copilot Chat with full context
- **Intelligent Query Suggestions** - AI-powered KQL recommendations based on your patterns  
- **ML Training System** - AI learns from your query history and improves over time
- **Advanced Pattern Recognition** - Custom models trained on your specific use cases

### ⚙️ Configuration Options

**Virtual File System Settings:**
```json
{
  "kustox.results.storageMode": "hybrid",
  "kustox.results.maxMemoryResults": 100,
  "kustox.results.retentionDays": 30,
  "kustox.vfs.enableAutoOpen": true,
  "kustox.vfs.prioritizeJsonFocus": true
}
```

**Storage Modes:**
- `memory` - Temporary, fastest access, cleared on restart
- `disk` - Persistent, survives VS Code restarts and system reboots  
- `hybrid` - Memory cache + disk backup (recommended for AI workflows)

### 🎮 Command Palette Actions (Available Now)
- `KustoX: Toggle VFS Status` - Enable/disable Virtual File System
- `KustoX: Open VFS Explorer` - Browse Virtual File System contents
- `KustoX: Clear VFS Cache` - Reset cached query results

### 🔮 Coming Soon - Advanced AI Commands
- `KustoX: Train AI Model` - Manually trigger AI model training
- `KustoX: Export Training Data` - Export collected query patterns
- `KustoX: Configure AI Settings` - Manage AI training preferences

For detailed AI integration documentation, see [AI-INTEGRATION.md](./AI-INTEGRATION.md).

---

## 🏆 Why Choose KustoX?

### 🌟 **Industry-Leading Innovation**
KustoX is the **only** Kusto extension that provides true dual-access architecture - you don't have to choose between beautiful visualizations or AI capabilities. Our revolutionary VFS technology gives you both simultaneously.

### 🚀 **Competitive Advantages**
- **🥇 First-to-Market**: Industry-first Virtual File System for AI-accessible query results
- **🎯 Zero Compromise**: Visual experience + AI access without trade-offs  
- **🧠 Smart Learning**: AI that learns from YOUR specific query patterns
- **⚡ Real-Time Integration**: Instant AI access via `kustox-ai://results/` scheme
- **🔄 Future-Proof**: Built for the AI-driven data exploration era

### 📊 **What Makes Us Different**
| Feature | Traditional Extensions | KustoX VFS |
|---------|----------------------|------------|
| Visual Results | ✅ Beautiful tables/charts | ✅ Beautiful tables/charts |
| AI Access | ❌ Manual export required | ✅ Real-time via VFS |
| Learning Capability | ❌ Static suggestions | ✅ AI learns your patterns |
| Dual Access | ❌ Choose one or the other | ✅ Both simultaneously |
| Future Ready | ❌ Limited AI integration | ✅ Built for AI-first workflows |

**Experience the future of data exploration today!**

---

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
