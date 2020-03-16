"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const pairify = require("pairify");
const vscode_languageclient_1 = require("vscode-languageclient");
const constants_1 = require("./constants");
let client;
let clientReady = false;
const decorations = [];
function showEndLineTooltip(textEditor, code, line, text) {
    const lineText = code.split('\n')[line];
    if (typeof lineText === 'undefined') {
        console.log(`Kalia: no line #${line}`);
        return;
    }
    const lineLength = code.split('\n')[line].length;
    const decoration = vscode_1.window.createTextEditorDecorationType({
        after: {
            contentText: text,
            color: 'rgba(255, 255, 255, 0.25)'
        }
    });
    textEditor.setDecorations(decoration, [new vscode_1.Range(line, 0, line, lineLength)]);
    decorations.push(decoration);
}
function clearDecorations() {
    if (decorations.length > 0) {
        decorations.forEach(d => d.dispose());
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
        console.log('ready');
        clientReady = true;
        client.onNotification(constants_1.EVENTS.ANALYSIS, data => {
            console.log('client', data);
        });
    });
}
function activate(context) {
    startServer(context);
    vscode_1.window.onDidChangeTextEditorSelection(event => {
        const code = event.textEditor.document.getText();
        clearDecorations();
        const selection = event.selections[0];
        if (selection && selection.start) {
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
            if (clientReady) {
                // client.sendNotification(EVENTS.NEW_SELECTION, 1);
            }
        }
        // showEndLineTooltip(event.textEditor, code, selection.start.line, `  👈${selection.start.line}`);
    });
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