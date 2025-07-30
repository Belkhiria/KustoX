# KustoX Chart Visualization Features

## Overview
KustoX now supports interactive chart visualizations for Kusto queries with `render` commands, providing a experience similar to Kusto Explorer. When you execute queries with visualization commands, you'll see both tabular data and corresponding charts.

## Supported Chart Types

### 1. **Column Chart** (`render columnchart`)
- **Best for**: Comparing values across categories
- **Data format**: First column = categories, subsequent columns = values
- **Example**: Event counts by state, sales by region

```kusto
StormEvents
| summarize EventCount = count() by State
| top 10 by EventCount
| render columnchart
```

### 2. **Bar Chart** (`render barchart`)
- **Best for**: Horizontal comparison of values
- **Data format**: Same as column chart but displayed horizontally
- **Example**: Long category names that need more space

```kusto
StormEvents
| summarize EventCount = count() by EventType
| top 10 by EventCount
| render barchart
```

### 3. **Pie Chart** (`render piechart`)
- **Best for**: Showing proportions of a whole
- **Data format**: First column = categories, second column = values
- **Example**: Distribution percentages, market share

```kusto
StormEvents
| summarize EventCount = count() by EventType
| top 8 by EventCount
| render piechart
```

### 4. **Time Chart** (`render timechart`)
- **Best for**: Time series data analysis
- **Data format**: First column = datetime, subsequent columns = metrics
- **Example**: Trends over time, performance monitoring

```kusto
StormEvents
| where StartTime >= ago(365d)
| summarize EventCount = count() by bin(StartTime, 30d)
| order by StartTime asc
| render timechart
```

### 5. **Line Chart** (`render linechart`)
- **Best for**: Continuous data trends
- **Data format**: First column = x-axis values, subsequent columns = y-axis values
- **Example**: Performance trends, growth metrics

```kusto
StormEvents
| where DamageProperty > 0
| summarize AvgDamage = avg(DamageProperty) by bin(StartTime, 60d)
| order by StartTime asc
| render linechart
```

### 6. **Area Chart** (`render areachart`)
- **Best for**: Cumulative data visualization
- **Data format**: Same as line chart but with filled areas
- **Example**: Cumulative totals, stacked metrics

```kusto
StormEvents
| where StartTime >= ago(180d)
| summarize EventCount = count() by bin(StartTime, 7d)
| order by StartTime asc
| extend CumulativeEvents = row_cumsum(EventCount)
| project StartTime, CumulativeEvents
| render areachart
```

### 7. **Scatter Plot** (`render scatterchart`)
- **Best for**: Correlation analysis between two variables
- **Data format**: First column = x-values, second column = y-values
- **Example**: Relationship analysis, correlation studies

```kusto
StormEvents
| where DamageProperty > 0 and DeathsDirect >= 0
| project DamageProperty, DeathsDirect
| sample 100
| render scatterchart
```

## Features

### 📊 **Interactive Chart Display**
- **Tabbed Interface**: Switch between Chart and Table views
- **Responsive Design**: Charts adapt to different screen sizes
- **Theme Integration**: Automatically matches VS Code theme (dark/light)

### 🎨 **Visual Styling**
- **VS Code Theme Colors**: Charts use VS Code's color palette
- **Professional Appearance**: Clean, modern chart styling
- **Color Palette**: Intelligent color selection for multiple data series

### 📋 **Data Integration**
- **Automatic Detection**: Recognizes `render` commands in queries
- **Smart Data Mapping**: Automatically maps data columns to chart axes
- **Multi-series Support**: Handles multiple data series in one chart

### 🔄 **Chart Types Mapping**
| Kusto Command | Chart.js Type | Description |
|---------------|---------------|-------------|
| `render columnchart` | Bar (vertical) | Vertical columns |
| `render barchart` | Bar (horizontal) | Horizontal bars |
| `render piechart` | Pie | Circular proportions |
| `render timechart` | Line | Time series |
| `render linechart` | Line | Connected points |
| `render areachart` | Line (filled) | Filled area under line |
| `render scatterchart` | Scatter | Point correlation |

## Usage Instructions

### 1. **Write Query with Render Command**
```kusto
StormEvents
| summarize EventCount = count() by State
| top 10 by EventCount
| render columnchart  // This triggers chart visualization
```

### 2. **Execute Query**
- Press `F5` or use "Execute Query" command
- KustoX automatically detects the render command

### 3. **View Results**
- **Chart Tab**: Interactive visualization (default view)
- **Table Tab**: Traditional tabular data
- Switch between tabs as needed

### 4. **Chart Interaction**
- **Responsive**: Charts resize with window
- **Hover Effects**: See data values on hover
- **Legend**: Click to toggle data series visibility

## Data Format Guidelines

### **Column Chart / Bar Chart**
```
Category | Value1 | Value2
---------|--------|--------
State A  | 100    | 150
State B  | 200    | 120
```

### **Pie Chart**
```
Category | Count
---------|-------
Type A   | 45
Type B   | 30
Type C   | 25
```

### **Time Chart**
```
Timestamp           | Metric1 | Metric2
--------------------|---------|--------
2023-01-01T00:00:00 | 100     | 50
2023-01-02T00:00:00 | 120     | 60
```

### **Scatter Plot**
```
X_Value | Y_Value
--------|--------
10      | 20
15      | 25
20      | 30
```

## Technical Implementation

### **Chart Library**
- **Chart.js**: Industry-standard JavaScript charting library
- **CDN Delivery**: Fast loading from jsdelivr CDN
- **Version**: Latest stable version with full feature support

### **Theme Integration**
- **Adaptive Colors**: Automatically detects VS Code theme
- **Color Palette**: Uses VS Code's chart color variables
- **Grid Lines**: Matches editor grid color scheme

### **Performance Optimization**
- **Lazy Loading**: Charts only load when render command detected
- **Efficient Rendering**: Optimized for large datasets
- **Memory Management**: Proper cleanup when switching views

## Troubleshooting

### **Chart Not Displaying**
- ✅ Ensure query includes `render` command
- ✅ Check that data has appropriate structure
- ✅ Verify internet connection for Chart.js CDN

### **Data Not Mapping Correctly**
- ✅ First column should be categories/labels
- ✅ Subsequent columns should be numeric values
- ✅ Use meaningful column names for legends

### **Performance Issues**
- ✅ Limit data points for scatter plots (`| sample 100`)
- ✅ Use appropriate time bins for time series
- ✅ Consider `top N` for large category sets

## Examples Library

The extension includes `chart-test-queries.kql` with comprehensive examples:

1. **Basic Charts**: Column, bar, pie charts
2. **Time Series**: Time charts, line charts, area charts
3. **Advanced**: Scatter plots, multi-series charts
4. **Real-world**: Practical business intelligence examples

## Comparison with Kusto Explorer

| Feature | KustoX | Kusto Explorer |
|---------|--------|----------------|
| Chart Types | ✅ 7 types | ✅ 10+ types |
| Interactive | ✅ Yes | ✅ Yes |
| Theme Support | ✅ VS Code themes | ✅ Built-in themes |
| Tab Interface | ✅ Chart/Table tabs | ✅ Multiple views |
| Export | ❌ Not yet | ✅ Multiple formats |
| Drill-down | ❌ Not yet | ✅ Interactive |

## Future Enhancements

- 📈 Additional chart types (histogram, boxplot)
- 💾 Chart export functionality  
- 🔍 Interactive drill-down capabilities
- 📊 Dashboard-style multi-chart views
- 🎨 Custom color scheme configuration

This brings powerful data visualization capabilities directly into your VS Code Kusto development workflow!
