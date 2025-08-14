/**
 * Virtual File System Provider for KustoX Query Results
 * Ephemeral (session-only) storage - no persistence to disk
 */

import * as vscode from 'vscode';
import { QueryResult } from '../types';

export interface QueryResultEntry {
    id: string;
    timestamp: Date;
    query: string;
    result: QueryResult;
    database: string;
    cluster: string;
    rowCount: number;
    columnCount: number;
    webviewUri?: string;  // Link to the visual representation
}

/**
 * Virtual File System Provider for KustoX Query Results
 * Ephemeral single-file storage - overwrites with each new query result
 */
export class QueryResultsFileSystemProvider implements vscode.FileSystemProvider {
    static readonly SCHEME = 'kustox-ai';
    static readonly AUTHORITY = 'results';
    static readonly SINGLE_FILE_PATH = '/latest-result.json';
    
    // Make scheme and authority publicly accessible
    static getScheme(): string { return QueryResultsFileSystemProvider.SCHEME; }
    static getAuthority(): string { return QueryResultsFileSystemProvider.AUTHORITY; }
    static getLatestFileUri(): vscode.Uri {
        return vscode.Uri.parse(`${QueryResultsFileSystemProvider.SCHEME}://${QueryResultsFileSystemProvider.AUTHORITY}${QueryResultsFileSystemProvider.SINGLE_FILE_PATH}`);
    }
    
    private currentResult: QueryResultEntry | null = null;
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
    
    private _onResultAdded = new vscode.EventEmitter<QueryResultEntry>();
    readonly onResultAdded: vscode.Event<QueryResultEntry> = this._onResultAdded.event;
    
    private fileContents = new Map<string, Uint8Array>();

    constructor(context: vscode.ExtensionContext) {
        // No automatic files created - VFS starts empty
        // Only JSON results will be stored when queries are executed
    }

    /**
     * Add query result to VFS - overwrites any previous result
     * Session-only storage - no persistence to disk
     */
    addQueryResult(
        query: string, 
        result: QueryResult, 
        cluster: string, 
        database: string,
        webviewUri?: string
    ): string {
        console.log('VFS: Adding query result (single file mode)...', { query: query.substring(0, 50), cluster, database });
        
        const id = this.generateResultId();
        const entry: QueryResultEntry = {
            id,
            timestamp: new Date(),
            query,
            result,
            database,
            cluster,
            rowCount: result.rowCount || 0,
            columnCount: result.columns?.length || 0,
            webviewUri  // Reference to the visual display
        };

        // Store as current result (overwrites previous)
        this.currentResult = entry;
        
        // Create/update the single result file
        this.createSingleResultFile(entry);
        this.notifyFileChanges();
        
        // Emit event for tree refresh
        this._onResultAdded.fire(entry);
        
        console.log('VFS: Query result stored as single file with ID:', id);
        return id;
    }

    private createSingleResultFile(entry: QueryResultEntry) {
        console.log('VFS: Creating single result file for', entry.id);
        
        // Store only JSON format in memory - single file
        const jsonContent = this.generateJSON(entry);
        this.storeFile(QueryResultsFileSystemProvider.SINGLE_FILE_PATH, jsonContent);
        
        console.log('VFS: Created latest-result.json file with', jsonContent.length, 'bytes');
    }

    private storeFile(path: string, content: string) {
        const encoder = new TextEncoder();
        const uri = vscode.Uri.parse(`${QueryResultsFileSystemProvider.SCHEME}://${QueryResultsFileSystemProvider.AUTHORITY}${path}`);
        this.fileContents.set(uri.toString(), encoder.encode(content));
        
        console.log('VFS: Stored file at URI:', uri.toString());
    }

    private generateJSON(entry: QueryResultEntry): string {
        return JSON.stringify({
            metadata: {
                id: entry.id,
                timestamp: entry.timestamp,
                query: entry.query,
                cluster: entry.cluster,
                database: entry.database,
                rowCount: entry.rowCount,
                columnCount: entry.columnCount,
                visualDisplay: entry.webviewUri ? 'Available in KustoX visual view' : 'Execute query to see visual'
            },
            schema: entry.result.columns?.map(col => ({
                name: col,
                type: 'string' // Simplified for now
            })),
            data: entry.result.rows
        }, null, 2);
    }

    private updateLatestLink(id: string) {
        // No longer needed in single file mode - the file IS the latest
    }

    private notifyFileChanges() {
        const singleFileUri = vscode.Uri.parse(`${QueryResultsFileSystemProvider.SCHEME}://${QueryResultsFileSystemProvider.AUTHORITY}${QueryResultsFileSystemProvider.SINGLE_FILE_PATH}`);
        const events: vscode.FileChangeEvent[] = [
            { type: vscode.FileChangeType.Changed, uri: singleFileUri }
        ];
        this._emitter.fire(events);
    }

    private generateResultId(): string {
        return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current result (single file mode)
     */
    getAllResults(): QueryResultEntry[] {
        return this.currentResult ? [this.currentResult] : [];
    }

    /**
     * Get the current result by ID (single file mode)
     */
    getResult(id: string): QueryResultEntry | undefined {
        return this.currentResult?.id === id ? this.currentResult : undefined;
    }

    /**
     * Get the current result (regardless of ID)
     */
    getCurrentResult(): QueryResultEntry | null {
        return this.currentResult;
    }

    /**
     * Clear current result
     */
    clearCache() {
        this.currentResult = null;
        this.fileContents.clear();
        
        // Fire deletion event for the JSON file if it existed
        this._emitter.fire([{
            type: vscode.FileChangeType.Deleted,
            uri: vscode.Uri.parse(`${QueryResultsFileSystemProvider.SCHEME}://${QueryResultsFileSystemProvider.AUTHORITY}${QueryResultsFileSystemProvider.SINGLE_FILE_PATH}`)
        }]);
    }

    /**
     * Get storage statistics (single file mode)
     */
    getStorageStats(): {
        memoryCount: number;
        totalSizeMB: number;
    } {
        const memorySize = this.currentResult ? JSON.stringify(this.currentResult).length : 0;

        return {
            memoryCount: this.currentResult ? 1 : 0,
            totalSizeMB: memorySize / (1024 * 1024)
        };
    }

    // FileSystemProvider implementation
    watch(uri: vscode.Uri): vscode.Disposable {
        // Return empty disposable - we don't support file watching
        // This prevents VS Code from trying to watch this as a workspace folder
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): vscode.FileStat {
        const path = uri.path;
        
        // Handle specific files we know about
        if (this.fileContents.has(uri.toString())) {
            return {
                type: vscode.FileType.File,
                ctime: Date.now(),
                mtime: Date.now(),
                size: this.fileContents.get(uri.toString())?.length || 0
            };
        }
        
        // Only allow the root directory - don't pretend other directories exist
        if (path === '/' || path === '') {
            return {
                type: vscode.FileType.Directory,
                ctime: Date.now(),
                mtime: Date.now(),
                size: 0
            };
        }
        
        // Throw FileNotFound for any other paths to prevent VS Code from treating this as a workspace
        throw vscode.FileSystemError.FileNotFound();
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
        const path = uri.path;
        
        // Only allow listing the root directory
        if (path === '/' || path === '') {
            const entries: [string, vscode.FileType][] = [];
            // Only show the single result file if it exists
            if (this.currentResult) {
                entries.push(['latest-result.json', vscode.FileType.File]);
            }
            
            // Log when Copilot is accessing the directory for debugging
            console.log('VFS: Directory listing requested, returning:', entries.length > 0 ? ['latest-result.json'] : 'empty');
            return entries;
        }
        
        // Don't allow listing any subdirectories - throw error to prevent workspace detection
        throw vscode.FileSystemError.FileNotFound();
    }

    createDirectory(): void {}

    readFile(uri: vscode.Uri): Uint8Array {
        console.log('VFS: File read requested for:', uri.toString());
        
        const content = this.fileContents.get(uri.toString());
        if (content) {
            console.log('VFS: Returning file content, size:', content.length, 'bytes');
            return content;
        }
        
        console.log('VFS: File not found:', uri.path);
        throw vscode.FileSystemError.FileNotFound();
    }

    writeFile(uri: vscode.Uri, content: Uint8Array): void {
        this.fileContents.set(uri.toString(), content);
        this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    }

    delete(uri: vscode.Uri): void {
        this.fileContents.delete(uri.toString());
        this._emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
    }

    rename(): void {}

    static register(context: vscode.ExtensionContext): QueryResultsFileSystemProvider {
        const provider = new QueryResultsFileSystemProvider(context);
        
        // Register with readonly flag to prevent workspace folder detection
        const disposable = vscode.workspace.registerFileSystemProvider(
            QueryResultsFileSystemProvider.SCHEME,
            provider,
            { 
                isCaseSensitive: true,
                isReadonly: false // Allow writes for our JSON files
            }
        );
        
        context.subscriptions.push(disposable);
        return provider;
    }
}
