# Example: AI-Optimized Query Result

This is an example of how query results would appear in the Virtual File System for AI agents.

## File Structure Example
```
kustox-ai://results/
├── README.md                    # This file - explains the VFS
├── latest/
│   └── link.txt                # Points to most recent result
└── history/
    └── result_1692123456789_abc123/
        ├── result.json         # Full structured data
        ├── result.csv          # CSV export
        ├── summary.md          # Human-readable summary
        ├── result.ai.json      # AI-optimized format
        └── visual-reference.md # Link to visual display
```

## AI-Optimized Format Preview

```json
{
  "context": {
    "visual_display": "Available in KustoX table view",
    "query_intent": "filtering",
    "suggested_actions": [
      "Compare with visual table for validation",
      "Generate insights from patterns",
      "Suggest query optimizations"
    ]
  },
  "metadata": {
    "id": "result_1692123456789_abc123",
    "timestamp": "2025-08-13T15:30:00.000Z",
    "query": "StormEvents | where EventType == 'Tornado' | take 100",
    "source": {
      "cluster": "https://help.kusto.windows.net",
      "database": "Samples"
    },
    "statistics": {
      "rowCount": 100,
      "columnCount": 15
    }
  },
  "schema": [
    {
      "name": "StartTime",
      "type": "datetime",
      "semanticType": "temporal"
    },
    {
      "name": "EventType",
      "type": "string",
      "semanticType": "categorical"
    },
    {
      "name": "DamageProperty",
      "type": "real",
      "semanticType": "metric"
    }
  ],
  "data": {
    "rows": [
      ["2007-01-01T00:00:00.000Z", "Tornado", 10000],
      ["2007-01-02T00:00:00.000Z", "Tornado", 25000]
    ],
    "sample": "First 100 rows shown"
  },
  "analysis_hints": {
    "timeColumn": "StartTime",
    "metricColumns": ["DamageProperty", "DeathsDirect"],
    "dimensionColumns": ["EventType", "State"]
  }
}
```

## Benefits for AI Agents

1. **Rich Context**: AI gets query intent and metadata
2. **Multiple Formats**: Choose JSON, CSV, or AI-optimized
3. **Analysis Hints**: Pre-computed insights guide AI analysis
4. **Visual Integration**: Links to human-readable table displays
5. **Persistence**: Results survive session restarts (configurable)

## Configuration

Users can configure storage behavior:
- **memory**: Temporary, fast access
- **disk**: Persistent, survives restarts
- **hybrid**: Both in-memory cache + disk backup (recommended)

## Workflow

1. User executes Kusto query normally
2. Results appear in beautiful visual table/chart
3. Simultaneously cached in VFS for AI access
4. AI agent reads structured data
5. User continues manual analysis with visual tools
6. AI provides complementary automated insights

This solution provides the best of both worlds: visual tables for humans, structured data for AI!
