import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'homePage',
        'Home Page',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))]
        }
    );

    const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'homePage.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'someCommand':
                    // Handle command from webview
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

export function deactivate() {}