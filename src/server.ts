import * as path from 'path';
import {
	createConnection,
	TextDocuments,
  ProposedFeatures,
	DidChangeConfigurationNotification,
	InitializeParams,
	RequestType
} from 'vscode-languageserver';

let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments = new TextDocuments();
const files = {};

connection.onInitialize((params) => {
	return {
		capabilities: {
      textDocumentSync: documents.syncKind
		}
	};
});

connection.onInitialized((params: InitializeParams) => {
  connection.client.register(DidChangeConfigurationNotification.type, undefined);
  connection.workspace.onDidChangeWorkspaceFolders(_event => {
    connection.console.log('Workspace folder change event received.');
	});
});

connection.onDidChangeConfiguration(change => {
	console.log('connection.onDidChangeConfiguration');
});

documents.onDidClose(e => {
	delete files[e.document.uri];
});

documents.onDidChangeContent(change => {
	const textDocument = change.document;
	console.log(`Working with ${path.basename(textDocument.uri)}`);
	let text = textDocument.getText();

	if (typeof files[textDocument.uri] === 'undefined') {
		files[textDocument.uri] = { text }
	}

	if (files[textDocument.uri].text !== text) {
		files[textDocument.uri].text = text;
		console.log(`Processing ${path.basename(textDocument.uri)}`);
	}

	connection.sendNotification('KaliaLS:foo', 'hello');
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