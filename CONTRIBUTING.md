# Contributing to KustoX

Thank you for your interest in contributing to KustoX! This document provides guidelines and information for contributors.

## 📄 Important Licensing Information

**KustoX uses dual licensing:**
- **Open Source**: AGPL-3.0 for community contributions
- **Commercial**: Separate license available for purchase

### 🔒 Contribution Requirements
1. **Fork Only**: You must **fork** this repository, not clone it directly
2. **Open Source Requirement**: All derivative works must remain open source under AGPL-3.0 unless you purchase a commercial license
3. **License Grant**: By contributing, you grant the project maintainer rights to relicense your contributions under both licenses
4. **CLA**: Contributors may be required to sign a Contributor License Agreement

## 🤝 How to Contribute

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Include VS Code version, extension version, and steps to reproduce
- Provide sample KQL queries that demonstrate the issue when applicable
- Include screenshots or error messages if relevant

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its use case clearly
- Consider if the feature aligns with the extension's goals
- Provide mockups or examples if applicable

### Code Contributions

#### Getting Started
1. **Fork** the repository on GitHub (required - do not clone directly)
2. Clone **your fork** locally: `git clone https://github.com/YOUR_USERNAME/KustoX.git`
3. Install dependencies: `npm install`
4. Make your changes in a feature branch
5. Test your changes: `npm run compile`
6. Submit a pull request to the original repository

#### Development Setup
```bash
# IMPORTANT: Fork the repository first, then clone YOUR fork
git clone https://github.com/YOUR_USERNAME/KustoX.git
cd KustoX

# Add the original repository as upstream (for syncing)
git remote add upstream https://github.com/Belkhiria/KustoX.git

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Package the extension for testing
npm run package
```

#### Keeping Your Fork Updated
```bash
# Fetch changes from upstream
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

#### Testing Your Changes
```bash
# Compile the project
npm run compile

# Test the extension in VS Code
# Press F5 to launch Extension Development Host
# Test your changes in the new VS Code window
```

## 📋 Development Guidelines

### Code Style
- Follow existing TypeScript conventions in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public functions and classes
- Keep functions focused and concise
- Remove debug `console.log` statements before committing

### Project Structure
```
KustoX/
├── src/
│   ├── connection/          # Connection management
│   ├── error/              # Error handling
│   ├── kusto/              # Kusto SDK integration
│   ├── mockData/           # Mock data generation
│   ├── query/              # Query execution
│   ├── types/              # TypeScript type definitions
│   ├── visualization/      # Chart utilities
│   └── webview/            # Webview management
├── syntaxes/               # KQL syntax highlighting
├── snippets/               # KQL code snippets
├── themes/                 # VS Code themes
└── examples/               # Example KQL files
```

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable
- Keep the first line under 50 characters
- Provide detailed description in the body if needed

Example:
```
Add cluster alias functionality

- Allow users to set custom display names for clusters
- Display aliases in connection tree instead of URLs
- Add edit functionality for existing cluster names
- Fixes #123
```

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure your code compiles without errors
4. Update documentation if needed
5. Add or update tests for new functionality
6. Ensure all existing tests pass
7. Update CHANGELOG.md with your changes
8. Submit a pull request with a clear description

## 🎯 Areas for Contribution

### High Priority
- **Additional chart types**: Heatmaps, treemaps, geographical charts
- **Enhanced IntelliSense**: Better KQL autocomplete and function suggestions
- **Performance optimizations**: Handling larger datasets more efficiently
- **Additional authentication methods**: Managed identity, certificate-based auth
- **Query optimization hints**: Suggestions for improving KQL query performance
- **Internationalization**: Support for multiple languages

### Medium Priority
- **Custom themes**: Additional VS Code themes optimized for KQL
- **Export enhancements**: Additional export formats and styling options
- **Connection profiles**: Save and manage multiple connection configurations
- **Query history**: Track and reuse previously executed queries
- **Schema explorer**: Enhanced database schema browsing
- **Query formatting**: Automatic KQL query formatting and beautification

### Documentation
- Improve existing documentation with more examples
- Create video tutorials for common workflows
- Add troubleshooting guides for common issues
- Document best practices for KQL development
- Translate documentation to other languages

### Testing
- Add unit tests for core functionality
- Add integration tests with mock Kusto clusters
- Test with different Azure environments
- Performance testing with large datasets
- Accessibility testing and improvements

## 🐛 Bug Reports

When reporting bugs, please include:

**Environment Information:**
- Extension version (found in VS Code Extensions panel)
- VS Code version
- Operating system and version
- Azure environment (if applicable)

**Bug Details:**
- Clear steps to reproduce the issue
- Expected behavior vs. actual behavior
- Sample KQL queries that demonstrate the issue
- Error messages or logs (check VS Code Developer Console)
- Screenshots if the issue is visual

**Example Bug Report:**
```markdown
## Bug: Export to Excel fails with large datasets

**Environment:**
- KustoX v0.1.0
- VS Code 1.74.0
- Windows 11

**Steps to Reproduce:**
1. Connect to cluster X
2. Run query: `table | take 10000`
3. Click "Excel" export button
4. Error appears: "Export failed"

**Expected:** Excel file should download
**Actual:** Error message shown

**Query:**
```kql
MyTable
| take 10000
| project col1, col2, col3
```

**Error Log:**
```
Export failed: RangeError: Maximum call stack size exceeded
```
```

## 💡 Feature Requests

For feature requests, please provide:

- **Problem Description**: What problem does this solve?
- **Proposed Solution**: How should this feature work?
- **Use Cases**: When would you use this feature?
- **Alternatives Considered**: What other solutions did you consider?
- **Additional Context**: Mockups, examples, or related features

## 🧪 Development Tips

### Setting Up Development Environment
1. Install Node.js 16+ and npm
2. Install VS Code and the Extension Development extensions
3. Clone the repository and run `npm install`
4. Use `npm run watch` during development for automatic compilation
5. Press F5 to launch the Extension Development Host for testing

### Debugging
- Use VS Code's built-in debugger for the extension
- Add breakpoints in TypeScript files
- Use the Debug Console for runtime inspection
- Check the Output panel for extension logs

### Testing Authentication
- Test with multiple Azure environments (commercial, government, etc.)
- Test different authentication methods
- Ensure proper error handling for authentication failures
- Test token refresh scenarios

### Working with Webviews
- The extension uses webviews for displaying query results
- Test with different data sizes and types
- Ensure proper styling across different VS Code themes
- Test export functionality thoroughly

## 📞 Getting Help

- **Documentation**: Check the README and wiki first
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Code Review**: Ask for reviews on pull requests

## 🏆 Recognition

Contributors will be:
- Listed in the CHANGELOG.md for their contributions
- Mentioned in release notes for significant features
- Added to a CONTRIBUTORS.md file (coming soon)

## 📄 License

By contributing to KustoX, you agree that your contributions will be licensed under the same project KustoX License.

## 🙏 Thank You

Your contributions help make KustoX better for the entire Kusto community. Whether you're fixing bugs, adding features, improving documentation, or helping other users, every contribution matters!

---

**Happy coding!** 🚀
