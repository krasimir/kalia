const languageServer = require('vscode-languageserver');
const {
	createConnection,
	TextDocuments,
  ProposedFeatures,
  DidChangeConfigurationNotification
} = languageServer;

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments();

connection.onInitialize((params) => {
  console.log('connection.onInitialize');
	return {
		capabilities: {
      textDocumentSync: documents.syncKind
		}
	};
});

connection.onInitialized(() => {
  console.log('connection.onInitialized');
  connection.client.register(DidChangeConfigurationNotification.type, undefined);
  connection.workspace.onDidChangeWorkspaceFolders(_event => {
    connection.console.log('Workspace folder change event received.');
  });
});

connection.onDidChangeConfiguration(change => {
	console.log('connection.onDidChangeConfiguration');
});

documents.onDidClose(e => {
	console.log('documents.onDidClose');
});

documents.onDidChangeContent(change => {
  console.log('documents.onDidChangeContent');
	const textDocument = change.document;
	let text = textDocument.getText();

	// console.log(text);
});

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});


documents.listen(connection);
connection.listen();