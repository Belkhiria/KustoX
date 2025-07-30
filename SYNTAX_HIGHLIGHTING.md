# KustoX Syntax Highlighting Features

## Overview
KustoX now provides comprehensive syntax highlighting and language support for Kusto Query Language (KQL), similar to what you'd find in Kusto Explorer. This includes color-coded syntax, intelligent snippets, and grammar checking.

## Syntax Highlighting Features

### Color-Coded Elements
- **Keywords**: Control flow keywords (let, if, case) in purple/magenta
- **Tabular Operators**: Query operators (where, project, summarize) in blue
- **Aggregation Functions**: Functions like count(), avg(), sum() in teal
- **Join Types**: inner, left, right joins in orange
- **Operators**: Logical (and, or), comparison (==, !=, contains), arithmetic (+, -, *, /) operators
- **Pipe Operator**: The `|` operator is highlighted prominently in yellow
- **Table Names**: Table names are highlighted in bright blue
- **Column Names**: Column references in light blue
- **Strings**: String literals in orange/brown
- **Numbers**: Numeric values in light green
- **Comments**: Comments in green with italic styling
- **Functions**: Function calls in yellow
- **Variables**: Parameter variables ($var) in pink
- **DateTime**: Date and time literals with special highlighting

### Language Configuration
- **Auto-closing pairs**: Automatically closes brackets, parentheses, quotes
- **Comment toggling**: Support for line comments (//) and block comments (/* */)
- **Bracket matching**: Highlights matching brackets and parentheses
- **Word pattern recognition**: Intelligent word boundary detection for KQL syntax
- **Indentation rules**: Smart indentation based on KQL structure

### Code Snippets
Over 30 pre-built code snippets for common KQL patterns:
- Basic query templates
- Aggregation patterns
- Join operations
- Time-based filtering
- String manipulation
- DateTime functions
- Visualization commands
- And many more...

## Usage

### Activating Syntax Highlighting
1. Open any `.kql` or `.kusto` file
2. The syntax highlighting will automatically activate
3. Use Ctrl+Shift+P and search for "Change Language Mode" to manually set to Kusto if needed

### Using Snippets
- Type the snippet prefix (e.g., `let`, `query`, `join`) and press Tab
- Use Ctrl+Space to see available snippets in context
- Navigate through snippet placeholders with Tab

### Custom Theme
- The extension includes a custom "KustoX Dark Theme" optimized for Kusto syntax
- Access it via File > Preferences > Color Theme > KustoX Dark Theme

## Examples

Here are some examples of how the syntax highlighting appears:

```kusto
// This is a comment - appears in green italic
let timeRange = ago(7d);  // Variables in pink, functions in yellow

StormEvents  // Table names in bright blue
| where StartTime >= timeRange  // Keywords in blue, operators highlighted
| where EventType contains "Tornado"  // String in orange, operators in white
| project StartTime, EventType, DamageProperty  // Columns in light blue
| summarize count() by EventType  // Aggregation functions in teal
| order by count_ desc  // More keywords in blue
| take 10;  // Semicolon punctuation
```

## Grammar and Error Detection

The extension provides:
- **Bracket matching**: Mismatched brackets are highlighted
- **Quote matching**: Unclosed strings are detected
- **Keyword recognition**: Invalid keywords are not highlighted
- **Function validation**: Proper function call syntax highlighting

## File Association

The following file extensions are automatically associated with Kusto language mode:
- `.kql` - Standard Kusto Query Language files
- `.kusto` - Alternative Kusto file extension

## Customization

You can customize the colors by:
1. Going to File > Preferences > Settings
2. Searching for "editor.tokenColorCustomizations"
3. Adding your custom colors for specific scopes

Example customization:
```json
{
  "editor.tokenColorCustomizations": {
    "[KustoX Dark Theme]": {
      "textMateRules": [
        {
          "scope": "keyword.operator.pipe.kusto",
          "settings": {
            "foreground": "#FF0000"
          }
        }
      ]
    }
  }
}
```

## Contributing

If you notice any syntax highlighting issues or have suggestions for improvements, please:
1. Check the existing issues on GitHub
2. Create a new issue with examples of the problematic syntax
3. Consider contributing to the grammar definition in `syntaxes/kusto.tmLanguage.json`

## Technical Details

The syntax highlighting is implemented using:
- **TextMate Grammar**: Comprehensive grammar definition covering all KQL constructs
- **Language Configuration**: Auto-completion, bracket matching, and indentation rules
- **Custom Theme**: Optimized color scheme for Kusto syntax elements
- **Snippet Library**: Pre-built code templates for common patterns

This provides a rich, IDE-like experience for writing and editing Kusto queries directly in VS Code.
