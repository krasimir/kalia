"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const code_inspector_1 = require("code-inspector");
const constants_1 = require("./constants");
let connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
let documents = new vscode_languageserver_1.TextDocuments();
const files = {};
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind
        }
    };
});
connection.onInitialized((params) => {
    connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
        connection.console.log('Workspace folder change event received.');
    });
});
connection.onDidChangeConfiguration(change => {
    console.log('connection.onDidChangeConfiguration');
});
connection.onNotification(constants_1.EVENTS.NEW_SELECTION, ({ uri, line }) => {
    if (files[uri]) {
        connection.sendNotification(constants_1.EVENTS.ANALYSIS, { analysis: code_inspector_1.analyze(files[uri].ast, line), line });
    }
});
documents.onDidClose(e => {
    delete files[e.document.uri];
});
documents.onDidChangeContent(change => {
    const textDocument = change.document;
    console.log(`Working with ${path.basename(textDocument.uri)}`);
    let text = textDocument.getText();
    if (typeof files[textDocument.uri] === 'undefined') {
        files[textDocument.uri] = {
            text,
            ast: code_inspector_1.toAST(text)
        };
    }
    if (files[textDocument.uri].text !== text) {
        files[textDocument.uri].text = text;
        files[textDocument.uri].ast = code_inspector_1.toAST(text);
    }
    // connection.sendNotification('KaliaLS:analysis', 'hello');
});
// connection.onDidChangeWatchedFiles(_change => {
// 	// Monitored files have change in VSCode
// 	connection.console.log('We received an file change event');
// });
// connection.onDidOpenTextDocument((params) => {
// 	// A text document got opened in VSCode.
// 	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
// 	// params.textDocument.text the initial full content of the document.
// 	connection.console.log(`${params.textDocument.uri} opened.`);
// });
// connection.onDidChangeTextDocument((params) => {
// 	// The content of a text document did change in VSCode.
// 	// params.textDocument.uri uniquely identifies the document.
// 	// params.contentChanges describe the content changes to the document.
// 	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
// });
// connection.onDidCloseTextDocument((params) => {
// 	// A text document got closed in VSCode.
// 	// params.textDocument.uri uniquely identifies the document.
// 	connection.console.log(`${params.textDocument.uri} closed.`);
// });
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map