const vscode = require('vscode');
const pairify = require('pairify');
const {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} = require('vscode-languageclient');

let client;

const decorations = [];

function showEndLineTooltip(textEditor, code, line, text) {
	const lineText = code.split('\n')[line];
	if (typeof lineText === 'undefined') {
		console.log(`Kalia: no line #${line}`);
		return;
	}
	const lineLength = code.split('\n')[line].length;
	const decoration = vscode.window.createTextEditorDecorationType({
		after: {
			rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen,
			contentText: text,
			color: 'rgba(255, 255, 255, 0.25)'
		}
	});
	textEditor.setDecorations(decoration, [new vscode.Range(line, 0, line, lineLength)]);
	decorations.push(decoration);
}
function clearDecorations() {
	if (decorations.length > 0) {
		decorations.forEach(d => d.dispose())
	}
}
function startServer(context) {
	let serverModule = context.asAbsolutePath('src/server.js');
	let serverOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ['--nolazy', '--inspect=6009'] }
		}
	};
	let clientOptions = {
		documentSelector: [
			{ scheme: 'file', language: 'javascript' },
			{ scheme: 'file', language: 'typescript' }
		],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	client = new LanguageClient(
		'languageServerKalia',
		'Language Server Kalia',
		serverOptions,
		clientOptions
	);
	client.start();
}

function activate(context) {
	startServer(context);
	vscode.window.onDidChangeTextEditorSelection(event => {
		const code = event.textEditor.document.getText();
		clearDecorations();
		const selection = event.selections[0];
		if (selection && selection.start) {
			const pairs = pairify
				.match(code, selection.start.line + 1, selection.start.character + 1)
				.filter(({ type }) => type === 'curly');
			if (pairs.length > 0) {
				const pair = pairs.pop();
				if (pair.to[0]-2 - pair.from[0] >= 0) {
					const scopeDecoration = vscode.window.createTextEditorDecorationType({
						rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
						borderColor: 'rgba(77, 184, 211, 0.15)',
						borderWidth: '1px',
						borderStyle: 'none none none solid',
					});
					event.textEditor.setDecorations(scopeDecoration, [new vscode.Range(pair.from[0], 0, pair.to[0]-2, 0)]);
					decorations.push(scopeDecoration);
				}
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
}
