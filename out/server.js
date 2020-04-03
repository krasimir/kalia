"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const code_inspector_1 = require("code-inspector");
const constants_1 = require("./constants");
const throttle = require('lodash/throttle');
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
    // when the cursor moves
});
documents.onDidClose(e => {
    delete files[e.document.uri];
});
documents.onDidChangeContent(throttle(change => {
    const textDocument = change.document;
    const fileName = path.basename(textDocument.uri);
    console.log(`${fileName} content changed`);
    let text = textDocument.getText();
    if (typeof files[textDocument.uri] === 'undefined') {
        files[textDocument.uri] = { text };
    }
    if (files[textDocument.uri].text !== text) {
        files[textDocument.uri].text = text;
        try {
            console.log(`New static analysis issued for ${fileName}`);
            files[textDocument.uri].analysis = code_inspector_1.analyze(text);
            connection.sendNotification(constants_1.EVENTS.ANALYSIS, { analysis: files[textDocument.uri].analysis });
        }
        catch (err) {
            console.log(`The static analysis for ${fileName} failed.`);
        }
    }
    // connection.sendNotification('KaliaLS:analysis', 'hello');
}, 1000));
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