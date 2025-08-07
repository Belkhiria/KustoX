export interface MockKustoResult {
    columns: string[];
    rows: any[][];
    rowCount: number;
    totalRows?: number;
    executionTime: string;
    hasData: boolean;
}

export class MockDataGenerator {
    private static generateRandomString(length: number = 10): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    private static generateRandomDate(): string {
        const start = new Date(2024, 0, 1);
        const end = new Date();
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString();
    }

    private static generateRandomIP(): string {
        return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    }

    private static generateRandomEmail(): string {
        const domains = ['microsoft.com', 'outlook.com', 'gmail.com', 'contoso.com', 'example.org'];
        const name = this.generateRandomString(8).toLowerCase();
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${name}@${domain}`;
    }

    public static generateTableData(rowCount: number = 100): MockKustoResult {
        const columns = [
            'TIMESTAMP',
            'ClusterName', 
            'NodeRole',
            'UserID',
            'Email',
            'IPAddress',
            'RequestCount',
            'ResponseTime',
            'StatusCode',
            'UserAgent',
            'Region',
            'EventType',
            'Severity',
            'Duration'
        ];

        const rows: any[][] = [];
        const nodeRoles = ['GW', 'Worker', 'Manager', 'Controller'];
        const regions = ['East US', 'West US', 'North Europe', 'Southeast Asia'];
        const eventTypes = ['Login', 'Query', 'Export', 'Upload', 'Download'];
        const severities = ['Info', 'Warning', 'Error', 'Critical'];
        const statusCodes = [200, 201, 400, 401, 404, 500];
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'KustoExplorer/4.0.0',
            'Azure Data Studio/1.0.0',
            'PowerBI/3.0.0'
        ];

        for (let i = 0; i < rowCount; i++) {
            const row = [
                this.generateRandomDate(),
                `cr14.eastus1-a.control.database.windows.net`,
                nodeRoles[Math.floor(Math.random() * nodeRoles.length)],
                `user${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                this.generateRandomEmail(),
                this.generateRandomIP(),
                Math.floor(Math.random() * 1000),
                Math.floor(Math.random() * 5000) + 100, // 100-5100ms
                statusCodes[Math.floor(Math.random() * statusCodes.length)],
                userAgents[Math.floor(Math.random() * userAgents.length)],
                regions[Math.floor(Math.random() * regions.length)],
                eventTypes[Math.floor(Math.random() * eventTypes.length)],
                severities[Math.floor(Math.random() * severities.length)],
                Math.floor(Math.random() * 300) + 10 // 10-310 seconds
            ];
            rows.push(row);
        }

        return {
            columns,
            rows,
            rowCount: rows.length,
            totalRows: rows.length,
            executionTime: `${(Math.random() * 2 + 0.5).toFixed(2)}s`,
            hasData: rows.length > 0
        };
    }

    public static generateTimeSeriesData(rowCount: number = 50): MockKustoResult {
        const columns = ['TIMESTAMP', 'Value', 'Category', 'Metric'];
        const rows: any[][] = [];
        const categories = ['CPU', 'Memory', 'Network', 'Disk'];
        const metrics = ['Usage', 'Latency', 'Throughput', 'Errors'];

        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 24); // Last 24 hours

        for (let i = 0; i < rowCount; i++) {
            const timestamp = new Date(startTime.getTime() + (i * 30 * 60 * 1000)); // 30-minute intervals
            const row = [
                timestamp.toISOString(),
                Math.random() * 100,
                categories[Math.floor(Math.random() * categories.length)],
                metrics[Math.floor(Math.random() * metrics.length)]
            ];
            rows.push(row);
        }

        return {
            columns,
            rows,
            rowCount: rows.length,
            totalRows: rows.length,
            executionTime: `${(Math.random() * 1 + 0.3).toFixed(2)}s`,
            hasData: rows.length > 0
        };
    }

    public static generateSecurityData(rowCount: number = 75): MockKustoResult {
        const columns = [
            'TIMESTAMP', 
            'SourceIP', 
            'DestinationIP', 
            'Port', 
            'Protocol', 
            'Action', 
            'ThreatLevel',
            'Country',
            'BytesTransferred'
        ];
        const rows: any[][] = [];
        const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS'];
        const actions = ['Allow', 'Block', 'Alert', 'Monitor'];
        const threatLevels = ['Low', 'Medium', 'High', 'Critical'];
        const countries = ['US', 'GB', 'DE', 'CN', 'RU', 'BR', 'IN'];

        for (let i = 0; i < rowCount; i++) {
            const row = [
                this.generateRandomDate(),
                this.generateRandomIP(),
                this.generateRandomIP(),
                Math.floor(Math.random() * 65536),
                protocols[Math.floor(Math.random() * protocols.length)],
                actions[Math.floor(Math.random() * actions.length)],
                threatLevels[Math.floor(Math.random() * threatLevels.length)],
                countries[Math.floor(Math.random() * countries.length)],
                Math.floor(Math.random() * 1000000)
            ];
            rows.push(row);
        }

        return {
            columns,
            rows,
            rowCount: rows.length,
            totalRows: rows.length,
            executionTime: `${(Math.random() * 3 + 0.8).toFixed(2)}s`,
            hasData: rows.length > 0
        };
    }

    public static generateRandomData(rowCount: number = 100, columnCount: number = 10): MockKustoResult {
        const columns: string[] = [];
        for (let i = 0; i < columnCount; i++) {
            columns.push(`Column${i + 1}`);
        }

        const rows: any[][] = [];
        for (let i = 0; i < rowCount; i++) {
            const row: any[] = [];
            for (let j = 0; j < columnCount; j++) {
                const rand = Math.random();
                if (rand < 0.3) {
                    row.push(this.generateRandomString(8));
                } else if (rand < 0.6) {
                    row.push(Math.floor(Math.random() * 10000));
                } else if (rand < 0.8) {
                    row.push(this.generateRandomDate());
                } else {
                    row.push(Math.random() * 100);
                }
            }
            rows.push(row);
        }

        return {
            columns,
            rows,
            rowCount: rows.length,
            totalRows: rows.length,
            executionTime: `${(Math.random() * 2 + 0.5).toFixed(2)}s`,
            hasData: rows.length > 0
        };
    }
}
