# AI Integration - Virtual File System for Query Results

This document explains the AI integration features added to KustoX, specifically the Virtual File System (VFS) that makes query results accessible to AI agents like Copilot Studio.

## Overview

The VFS provides a bridge between KustoX's visual query results and AI agents by creating virtual files that represent query data in structured formats. This enables AI analysis while preserving the existing visual table/chart experience for manual troubleshooting.

## How It Works

### 1. Dual Display Mode
- **Visual Display**: Query results continue to appear in beautiful DataTables/Chart.js views
- **AI Access**: Same results are simultaneously cached in the VFS for AI agents
- **No Disruption**: Existing workflow remains unchanged

### 2. Virtual File System Structure
```
kustox-ai://results/
├── README.md                    # VFS documentation
├── latest/
│   └── link.txt                # Points to most recent result
└── history/
    └── result_[timestamp]_[id]/
        ├── result.json         # Full structured data
        ├── result.csv          # CSV export  
        ├── summary.md          # Human-readable summary
        ├── result.ai.json      # AI-optimized format
        └── visual-reference.md # Links to visual display
```

### 3. Storage Modes

#### Memory Mode (Temporary)
- Results stored in RAM only
- Fast access, lost on restart
- Good for: Quick sessions, sensitive data

#### Disk Mode (Persistent) 
- Results saved to disk immediately
- Survive VS Code restarts
- Good for: Long-term analysis, audit trails

#### Hybrid Mode (Recommended)
- Recent results in memory for speed
- All results backed up to disk
- Best performance + persistence
- Configurable retention period

## AI-Optimized Format

The `result.ai.json` files include enhanced metadata for better AI understanding:

```json
{
  "context": {
    "visual_display": "Available in KustoX table view",
    "query_intent": "filtering|aggregation|correlation|visualization",
    "suggested_actions": [
      "Compare with visual table for validation",
      "Generate insights from patterns", 
      "Suggest query optimizations"
    ]
  },
  "metadata": {
    "id": "result_timestamp_id",
    "timestamp": "ISO datetime",
    "query": "Original KQL query",
    "source": {
      "cluster": "cluster URL", 
      "database": "database name"
    },
    "statistics": {
      "rowCount": 100,
      "columnCount": 15
    }
  },
  "schema": [
    {
      "name": "column_name",
      "type": "data_type",
      "semanticType": "temporal|metric|identifier|categorical"
    }
  ],
  "data": {
    "rows": "full_dataset",
    "sample": "first_100_rows"
  },
  "analysis_hints": {
    "timeColumn": "detected_time_column",
    "metricColumns": ["numeric_columns"],
    "dimensionColumns": ["categorical_columns"]
  }
}
```

## New Commands

### For Users
- **Analyze with AI** (`kustox.analyzeWithAI`): Access AI analysis options
- **Open Results Explorer** (`kustox.openResultsExplorer`): Browse VFS
- **Export for AI** (`kustox.exportResultsForAI`): Get AI-optimized format
- **Storage Stats** (`kustox.showStorageStats`): View cache statistics
- **Clear Cache** (`kustox.clearResultCache`): Reset result cache

### For AI Agents
- Read files from `kustox-ai://results/` scheme
- Access latest results via `kustox-ai://results/latest/`
- Browse history via `kustox-ai://results/history/`
- Multiple format options for different use cases

## Configuration

Add to your VS Code settings:

```json
{
  "kustox.results.storageMode": "hybrid",
  "kustox.results.maxMemoryResults": 100, 
  "kustox.results.retentionDays": 30,
  "kustox.ai.autoExport": true
}
```

### Storage Modes
- `"memory"` - Temporary, in-memory only
- `"disk"` - Persistent, disk storage only  
- `"hybrid"` - Memory cache + disk backup (recommended)

### Other Settings
- `maxMemoryResults`: Number of results to keep in memory (10-1000)
- `retentionDays`: Days to keep results on disk (0 = forever)
- `autoExport`: Automatically make results available to AI

## Usage Workflow

### For Manual Analysis (Unchanged)
1. Execute queries with F5 or Run button
2. View results in visual tables/charts
3. Use DataTables features (sort, filter, export)
4. Troubleshoot manually as before

### For AI Analysis (New)
1. Execute queries normally (visual results appear)
2. Use "Analyze with AI" command for AI options
3. AI agents can read structured data from VFS
4. Get both human insights (visual) + AI insights (automated)

## File Locations

### Default Storage Path
- Windows: `%APPDATA%\Code\User\globalStorage\kustox\query-results\`
- macOS: `~/Library/Application Support/Code/User/globalStorage/kustox/query-results/`
- Linux: `~/.config/Code/User/globalStorage/kustox/query-results/`

### File Structure
Each query result creates:
- `data.json` - Internal storage format
- `result.json` - Structured export
- `result.csv` - CSV format
- `summary.md` - Human-readable summary
- `result.ai.json` - AI-optimized format
- `visual-reference.md` - Links to visual display

## Benefits

### For Users
- ✅ **No workflow changes** - visual tables work exactly as before
- ✅ **Enhanced capabilities** - AI insights complement manual analysis
- ✅ **Flexible storage** - choose temporary or persistent modes
- ✅ **Performance optimized** - intelligent caching strategies

### For AI Agents
- ✅ **Rich context** - metadata, schema, and analysis hints
- ✅ **Multiple formats** - JSON, CSV, Markdown options
- ✅ **Structured access** - standard file system interface
- ✅ **Historical data** - access to previous query results

### For Development
- ✅ **Clean architecture** - VFS doesn't interfere with existing code
- ✅ **Extensible design** - easy to add new AI features
- ✅ **Error handling** - graceful fallbacks if VFS fails
- ✅ **Configurable** - users control storage behavior

## Troubleshooting

### No Results in VFS
- Check if queries are returning data (`hasData: true`)
- Verify VFS is initialized (`kustox.showStorageStats`)
- Check configuration (`kustox.results.storageMode`)

### Storage Issues  
- Check disk space if using disk/hybrid mode
- Verify write permissions to storage directory
- Check retention settings if results disappear

### AI Access Issues
- Ensure AI agent can access `kustox-ai://` scheme
- Try opening VFS files manually first
- Check file format matches AI expectations

## Future Enhancements

Potential AI integration features:
- Real-time query suggestions based on patterns
- Automatic anomaly detection in results
- Query optimization recommendations  
- Natural language query generation
- Intelligent data visualization suggestions
- Collaborative AI-human analysis workflows

## Technical Details

### Virtual File System Implementation
- Custom VS Code FileSystemProvider
- In-memory file content management
- Disk persistence with metadata indexing
- Automatic cleanup based on retention policies

### Performance Optimizations
- Lazy file generation (created when accessed)
- Memory limits with LRU eviction
- Efficient JSON serialization
- Minimal disk I/O in memory mode

### Security Considerations
- Results stored in user's VS Code global storage
- No network transmission of query data
- User-controlled retention and cleanup
- Standard VS Code extension security model

This AI integration makes KustoX a powerful platform for both human and artificial intelligence to collaborate on data analysis!
