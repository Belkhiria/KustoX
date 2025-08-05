/**
 * Chart data preparation and visualization utilities
 */

import { ChartData } from '../types';

export function prepareChartData(results: any, chartType: string): ChartData {
    if (!results.rows || results.rows.length === 0) {
        return { labels: [], datasets: [] };
    }

    const columns = results.columns;
    const rows = results.rows;

    // For most charts, assume first column is labels, subsequent columns are data
    const labels = rows.map((row: any[]) => String(row[0] || ''));
    
    switch (chartType) {
        case 'piechart':
            // For pie chart, use first column as labels, second as values
            const pieData = rows.map((row: any[]) => ({
                label: String(row[0] || ''),
                value: Number(row[1]) || 0
            }));
            return {
                labels: pieData.map((d: any) => d.label),
                data: pieData.map((d: any) => d.value)
            };

        case 'timechart':
        case 'linechart':
        case 'areachart':
            // For time series, first column should be datetime
            const timeData = rows.map((row: any[]) => ({
                x: row[0], // Keep original format, Chart.js will handle datetime
                y: Number(row[1]) || 0
            }));
            return {
                labels: labels,
                datasets: [{
                    label: columns[1] || 'Value',
                    data: timeData.map((d: any) => d.y),
                    borderColor: '#007ACC',
                    backgroundColor: chartType === 'areachart' ? 'rgba(0, 122, 204, 0.1)' : undefined,
                    fill: chartType === 'areachart'
                }]
            };

        case 'scatterchart':
            // For scatter, assume x and y coordinates in first two columns
            const scatterData = rows.map((row: any[]) => ({
                x: Number(row[0]) || 0,
                y: Number(row[1]) || 0
            }));
            return {
                datasets: [{
                    label: 'Data Points',
                    data: scatterData,
                    backgroundColor: '#007ACC',
                    borderColor: '#007ACC'
                }]
            };

        case 'columnchart':
        case 'barchart':
        default:
            // For bar/column charts, create datasets for each numeric column after the first
            const datasets = [];
            for (let i = 1; i < columns.length; i++) {
                const data = rows.map((row: any[]) => Number(row[i]) || 0);
                datasets.push({
                    label: columns[i],
                    data: data,
                    backgroundColor: `rgba(0, 122, 204, 0.8)`,
                    borderColor: '#007ACC',
                    borderWidth: 1
                });
            }
            
            return {
                labels: labels,
                datasets: datasets.length > 0 ? datasets : [{
                    label: 'Values',
                    data: rows.map((row: any[]) => Number(row[1]) || 0),
                    backgroundColor: 'rgba(0, 122, 204, 0.8)',
                    borderColor: '#007ACC',
                    borderWidth: 1
                }]
            };
    }
}

export function generateChartScript(chartData: any, chartType: string): string {
    const isHorizontal = chartType === 'barchart';
    
    switch (chartType) {
        case 'piechart':
            return `
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(chartData.labels)},
                        datasets: [{
                            data: ${JSON.stringify(chartData.data)},
                            backgroundColor: colorPalette.slice(0, ${chartData.labels?.length || 0}),
                            borderColor: colors.text,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: colors.text }
                            }
                        }
                    }
                });
            `;

        case 'scatterchart':
            return `
                new Chart(ctx, {
                    type: 'scatter',
                    data: ${JSON.stringify(chartData)},
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { 
                                type: 'linear',
                                grid: { color: colors.gridLines },
                                ticks: { color: colors.text }
                            },
                            y: { 
                                type: 'linear',
                                grid: { color: colors.gridLines },
                                ticks: { color: colors.text }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: colors.text } }
                        }
                    }
                });
            `;

        case 'timechart':
        case 'linechart':
        case 'areachart':
            return `
                new Chart(ctx, {
                    type: 'line',
                    data: ${JSON.stringify(chartData)},
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { 
                                type: '${chartType === 'timechart' ? 'time' : 'category'}',
                                grid: { color: colors.gridLines },
                                ticks: { color: colors.text }
                            },
                            y: { 
                                grid: { color: colors.gridLines },
                                ticks: { color: colors.text }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: colors.text } }
                        }
                    }
                });
            `;

        default:
            return `
                new Chart(ctx, {
                    type: '${isHorizontal ? 'bar' : 'bar'}',
                    data: ${JSON.stringify(chartData)},
                    options: {
                        ${isHorizontal ? 'indexAxis: "y",' : ''}
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { 
                                grid: { color: colors.gridLines },
                                ticks: { color: colors.text }
                            },
                            y: { 
                                grid: { color: colors.gridLines },
                                ticks: { color: colors.text }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: colors.text } }
                        }
                    }
                });
            `;
    }
}

export function getChartTitle(chartType: string): string {
    const titles: { [key: string]: string } = {
        'columnchart': 'Column Chart',
        'barchart': 'Bar Chart',
        'piechart': 'Pie Chart',
        'timechart': 'Time Series Chart',
        'linechart': 'Line Chart',
        'areachart': 'Area Chart',
        'scatterchart': 'Scatter Plot'
    };
    return titles[chartType] || 'Chart';
}
