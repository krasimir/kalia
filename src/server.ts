import * as path from 'path';
import {
	createConnection,
	TextDocuments,
  ProposedFeatures,
	DidChangeConfigurationNotification,
	InitializeParams,
	RequestType
} from 'vscode-languageserver';
import { analyze } from 'code-inspector';

import { EVENTS } from './constants';

const throttle = require('lodash/throttle');
let connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments = new TextDocuments();
const files = {};

function generateAnalysis(uri, text) {
	const fileName = path.basename(uri);
	console.log(`Generating static analysis for ${fileName}`, text.length);

	if (typeof files[uri] === 'undefined') {
		files[uri] = {}
	}

	if (files[uri].text !== text) {
		files[uri].text = text;
		try {
			console.log(`New static analysis issued for ${fileName}`);
			files[uri].analysis = analyze(text);
			connection.sendNotification(
				EVENTS.ANALYSIS,
				{ analysis: files[uri].analysis }
			);
		} catch(err) {
			console.log(`The static analysis for ${fileName} failed.`);
		}
	}
}

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

connection.onNotification(EVENTS.NEW_SELECTION, ({ uri, line }) => {
	// when the cursor moves
});
connection.onNotification(EVENTS.GENERATE_ANALYSIS, ({ uri, text }) => {
	generateAnalysis(uri, text);
});

documents.onDidClose(e => {
	delete files[e.document.uri];
});

documents.onDidChangeContent(throttle(change => {
	generateAnalysis(change.document.uri, change.document.getText());
}, 1500));

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});
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