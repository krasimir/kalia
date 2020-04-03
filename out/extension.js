"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const pairify = require("pairify");
const vscode_languageclient_1 = require("vscode-languageclient");
const constants_1 = require("./constants");
let client;
let clientReady = false;
let decorations = [];
let currentLineAnalysis;
function clearDecorations() {
    if (decorations.length > 0) {
        decorations.forEach(d => d.dispose());
        decorations = [];
    }
}
function startServer(context) {
    let serverModule = context.asAbsolutePath('out/server.js');
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: vscode_languageclient_1.TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] }
        }
    };
    let clientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'javascript' },
            { scheme: 'file', language: 'javascriptreact' },
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'typescriptreact' },
        ],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    client = new vscode_languageclient_1.LanguageClient('KaliaLS', 'KaliaLS', serverOptions, clientOptions);
    client.start();
    client.onReady().then(() => {
        clientReady = true;
        client.onNotification(constants_1.EVENTS.ANALYSIS, ({ analysis, line }) => {
            currentLineAnalysis = analysis;
        });
    });
}
function activate(context) {
    startServer(context);
    vscode_1.window.onDidChangeTextEditorSelection(event => {
        const code = vscode_1.window.activeTextEditor.document.getText();
        clearDecorations();
        const selection = event.selections[0];
        if (selection && selection.start && event.textEditor.document === vscode_1.window.activeTextEditor.document) {
            // scope line
            const pairs = pairify
                .match(code, selection.start.line + 1, selection.start.character + 1)
                .filter(({ type }) => type === 'curly');
            if (pairs.length > 0) {
                const pair = pairs.pop();
                if (pair.to[0] - 2 - pair.from[0] >= 0) {
                    const scopeDecoration = vscode_1.window.createTextEditorDecorationType({
                        rangeBehavior: vscode_1.DecorationRangeBehavior.ClosedClosed,
                        borderColor: 'rgba(77, 184, 211, 0.15)',
                        borderWidth: '1px',
                        borderStyle: 'none none none solid',
                    });
                    event.textEditor.setDecorations(scopeDecoration, [new vscode_1.Range(pair.from[0], 0, pair.to[0] - 2, 0)]);
                    decorations.push(scopeDecoration);
                }
            }
            // scope path
            if (clientReady) {
                client.sendNotification(constants_1.EVENTS.NEW_SELECTION, {
                    line: selection.start.line + 1,
                    uri: vscode_1.window.activeTextEditor.document.uri.toString()
                });
            }
        }
    });
    context.subscriptions.push(vscode_1.commands.registerCommand('Kalia.goto', () => {
        if (!currentLineAnalysis || !currentLineAnalysis.scopes)
            return;
        const quickPick = vscode_1.window.createQuickPick();
        quickPick.title = 'Enter keywords for snippet search (e.g. "read file")';
        quickPick.items = currentLineAnalysis.scopes.map(node => {
            return { label: node.text };
        });
        quickPick.onDidChangeValue(() => {
            quickPick.activeItems = [];
        });
        quickPick.onDidAccept(() => {
            let search = "";
            console.log(quickPick.activeItems);
            quickPick.hide();
        });
        quickPick.show();
    }));
    const provider = vscode_1.languages.registerCompletionItemProvider([
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'javascriptreact' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'typescriptreact' },
    ], {
        provideCompletionItems(document, position, token, context) {
            const item = new vscode_1.CompletionItem('goto');
            item.kind = vscode_1.CompletionItemKind.Keyword;
            item.insertText = '';
            item.command = {
                command: 'Kalia.goto',
                title: 'Kalia.goto'
            };
            return [item];
        }
    });
    context.subscriptions.push(provider);
}
function deactivate() {
    if (client) {
        client.stop();
    }
}
module.exports = {
    activate,
    deactivate
};
//# sourceMappingURL=extension.js.map