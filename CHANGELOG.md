# Changelog

All notable changes to the "KustoX - Modern Kusto Explorer" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source preparation
- Comprehensive documentation improvements
- Code cleanup and optimization

## [0.1.0] - 2025-08-08

### Added
- Initial release of KustoX extension
- Connection tree for managing Kusto clusters and databases
- Advanced syntax highlighting with custom KQL grammar
- Rich data visualizations with Chart.js integration
- Enhanced error reporting with detailed Kusto-specific messages
- DataTables integration with advanced filtering and export capabilities
- Mock data generation for local testing
- Cluster alias/display name functionality
- Professional table features including:
  - Column resizing and sorting
  - Advanced filtering with ColumnControl
  - Copy functionality (HTML, CSV, Excel, PDF export)
  - Cell selection and keyboard shortcuts (Ctrl+C)
- Azure authentication integration with multiple methods:
  - Interactive browser authentication
  - Device code authentication
  - Azure CLI authentication
  - Application authentication
  - Custom client ID authentication
- Auto-discovery of databases and tables
- 30+ KQL code snippets for common queries
- Custom dark theme optimized for KQL syntax
- Connection status bar with real-time updates
- Context menus for easy cluster and database management

### Features

#### **Connection Management**
- Easy cluster management with persistent connections
- Support for multiple authentication methods
- Cluster aliases for better organization
- Database and table auto-discovery
- Connection string copying functionality

#### **Syntax Support**
- Complete KQL language support with IntelliSense
- Syntax highlighting for KQL files (.kql, .kusto)
- Code snippets for common KQL patterns
- Custom language configuration

#### **Data Visualization**
- Support for 7 chart types:
  - Column charts
  - Bar charts
  - Pie charts
  - Line charts
  - Area charts
  - Time series charts
  - Scatter plots
- Tab-based interface for chart and table views
- Interactive chart controls

#### **Data Export & Manipulation**
- Multiple export formats with professional styling:
  - HTML with rich formatting
  - CSV files
  - Excel spreadsheets
  - PDF documents
- Advanced table filtering and sorting
- Cell selection and copying capabilities
- Column visibility controls

#### **Error Handling**
- Precise error locations and troubleshooting guidance
- Kusto-specific error parsing and display
- User-friendly error messages with actionable suggestions

#### **Development & Testing**
- Mock data generation for local testing
- Support for multiple data types and patterns
- No external dependencies required for testing

### Technical Details
- Built with TypeScript for type safety
- Uses Azure SDK for secure authentication
- DataTables.net for advanced table functionality
- Chart.js for data visualization
- Professional UI/UX following VS Code design guidelines

### Supported Platforms
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 18.04+)
- VS Code 1.74.0 or higher

---

## Release Notes

### 0.1.0 Release Highlights

🎉 **First Release**: Complete Kusto data exploration solution for VS Code

🔐 **Secure**: Multiple Azure authentication methods with no stored credentials

📊 **Professional**: Advanced data visualization and export capabilities

🎨 **Beautiful**: Custom dark theme and polished UI components

🚀 **Fast**: Optimized performance for large datasets

📈 **Comprehensive**: Everything you need for KQL development and data exploration

---

[Unreleased]: https://github.com/Belkhiria/KustoX/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Belkhiria/KustoX/releases/tag/v0.1.0
