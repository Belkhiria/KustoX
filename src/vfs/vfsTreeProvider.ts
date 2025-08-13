/**
 * Tree view provider for KustoX VFS files
 */

import * as vscode from 'vscode';
import { QueryResultsFileSystemProvider } from './queryResultsFileSystem';

export class VFSTreeProvider implements vscode.TreeDataProvider<VFSItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VFSItem | undefined | null | void> = new vscode.EventEmitter<VFSItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<VFSItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private vfsProvider: QueryResultsFileSystemProvider) {
        // Listen for new results and refresh the tree
        vfsProvider.onResultAdded(() => {
            this.refresh();
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: VFSItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: VFSItem): Thenable<VFSItem[]> {
        if (!element) {
            // Root level - single file mode
            const currentResult = this.vfsProvider.getCurrentResult();
            const items: VFSItem[] = [];
            
            if (currentResult) {
                // Show current result file
                items.push(new VFSItem(
                    `Latest Result: ${currentResult.id.substring(0, 12)}... (${currentResult.rowCount} rows)`,
                    vscode.TreeItemCollapsibleState.None,
                    `kustox-ai://results/latest-result.json`,
                    'current-result',
                    `Query executed at ${currentResult.timestamp.toLocaleString()}`
                ));
            } else {
                items.push(new VFSItem(
                    'No query results yet - execute a query to see results here',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    'empty'
                ));
            }
            
            return Promise.resolve(items);
        }
        
        return Promise.resolve([]);
    }
}

class VFSItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly vfsUri?: string,
        public readonly contextValue?: string,
        public readonly tooltip?: string
    ) {
        super(label, collapsibleState);
        
        if (vfsUri) {
            this.resourceUri = vscode.Uri.parse(vfsUri);
            this.command = {
                command: 'vscode.open',
                title: 'Open',
                arguments: [vscode.Uri.parse(vfsUri)]
            };
        }
        
        this.tooltip = tooltip || label;
        
        // Set icons
        switch (contextValue) {
            case 'current-result':
                this.iconPath = new vscode.ThemeIcon('file-code');
                break;
            case 'empty':
                this.iconPath = new vscode.ThemeIcon('info');
                break;
        }
    }
}
