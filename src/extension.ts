import * as path from 'path';
import {
	window,
	DecorationRangeBehavior,
	Range,
	workspace,
	commands,
	languages,
	TextDocument,
	CancellationToken,
	CompletionContext,
	CompletionItem,
	CompletionItemKind,
	Selection,
	Position
} from 'vscode';
import * as pairify from 'pairify';
import {
	LanguageClient,
	TransportKind
} from 'vscode-languageclient';
import { indent } from './utils';

import { EVENTS } from './constants';
import { Analysis, sort, isVariable } from 'code-inspector';

let client: LanguageClient;
let clientReady = false;
let decorations = [];
let analyses: Record<string, Analysis> = {};
let gotoCommandInterval;

function clearDecorations() {
	if (decorations.length > 0) {
		decorations.forEach(d => d.dispose());
		decorations = [];
	}
}
function startServer(context) {
	let serverModule = context.asAbsolutePath('out/server.js');
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
			{ scheme: 'file', language: 'javascriptreact' },
			{ scheme: 'file', language: 'typescript' },
			{ scheme: 'file', language: 'typescriptreact' },
		],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	client = new LanguageClient(
		'KaliaLS',
		'KaliaLS',
		serverOptions,
		clientOptions
	);
	client.start();
	client.onReady().then(() => {
		clientReady = true;
		client.onNotification(EVENTS.ANALYSIS, ({ analysis, uri }) => {
			analyses[uri] = analysis;
		});
	});
}

function gotoCommand() {
	const currentDocument = window.activeTextEditor.document;
	const uri = currentDocument ? currentDocument.uri.toString() : '';

	if (!analyses[uri]) {
		if (gotoCommandInterval) clearTimeout(gotoCommandInterval);
		gotoCommandInterval = setTimeout(gotoCommand, 3000);
		if (currentDocument) {
			window.showInformationMessage(`Code analysis for ${path.basename(uri)} in progress.`);
			client.sendNotification(
				EVENTS.GENERATE_ANALYSIS,
				{
					uri,
					text: currentDocument.getText()
				}
			);
		}
		return;
	};
	const nodes = sort([].concat(analyses[uri].variables, analyses[uri].scopes));
	const editor = window.activeTextEditor;
	const quickPick = window.createQuickPick();
	const ignoreScopeNodes = [
		'WhileStatement',
		'Program'
	];

	quickPick.title = 'Enter keywords for search (e.g. "Header.tsx")';

	quickPick.items = nodes
	.filter(node => !ignoreScopeNodes.includes(node.type))
	.map(node => {
		let prefix = '$(symbol-function) ';
		let postfix = '';
		if (
			editor.selection.start.line >= node.start[0]-1 &&
			editor.selection.start.line <= node.end[0]-1
		) {
			postfix = ' 👈';
		}
		if (isVariable(node)) {
			prefix = '$(symbol-variable) ';
		}
		return { label: indent(node.nesting - 1) + prefix + node.text + postfix, node }
	});

	quickPick.onDidChangeValue(() => {
		quickPick.activeItems = [];
	});

	quickPick.onDidAccept(() => {
		let search = "";
		if (quickPick.activeItems && quickPick.activeItems[0]) {
			const editor = window.activeTextEditor;
			const { node } = quickPick.activeItems[0] as any;
			const start = new Position(node.start[0]-1, node.start[1]-1);
			const end = start;
			editor.selection = new Selection(start, end);
			editor.revealRange(new Range(start, end));
		}
		quickPick.hide();
	});
	quickPick.show();
}

function activate(context) {
	startServer(context);

	window.onDidChangeTextEditorSelection(event => {
		const code = window.activeTextEditor.document.getText();
		clearDecorations();
		const selection = event.selections[0];
		if (selection && selection.start && event.textEditor.document === window.activeTextEditor.document) {

			// scope line
			const pairs = pairify
				.match(code, selection.start.line + 1, selection.start.character + 1)
				.filter(({ type }) => type === 'curly');
			if (pairs.length > 0) {
				const pair = pairs.pop();
				if (pair.to[0]-2 - pair.from[0] >= 0) {
					const scopeDecoration = window.createTextEditorDecorationType({
						rangeBehavior: DecorationRangeBehavior.ClosedClosed,
						borderColor: 'rgba(77, 184, 211, 0.15)',
						borderWidth: '1px',
						borderStyle: 'none none none solid',
					});
					event.textEditor.setDecorations(scopeDecoration, [new Range(pair.from[0], 0, pair.to[0]-2, 0)]);
					decorations.push(scopeDecoration);
				}
			}

			if (clientReady) {
				client.sendNotification(
					EVENTS.NEW_SELECTION,
					{
						line: selection.start.line + 1,
						uri: window.activeTextEditor.document.uri.toString()
					}
				);
			}

		}
	});

	context.subscriptions.push(
		commands.registerCommand('Kalia.goto', gotoCommand)
	);

	const provider = languages.registerCompletionItemProvider(
		[
			{ scheme: 'file', language: 'javascript' },
			{ scheme: 'file', language: 'javascriptreact' },
			{ scheme: 'file', language: 'typescript' },
			{ scheme: 'file', language: 'typescriptreact' },
		],
		{
			provideCompletionItems(
				document: TextDocument,
				position: any,
				token: CancellationToken,
				context: CompletionContext
			) {
				const item = new CompletionItem('goto');
				item.kind = CompletionItemKind.Keyword;
				item.insertText = '';
				item.command = {
					command: 'Kalia.goto',
					title: 'Kalia.goto'
				}
				return [item];
			}
		}
	);

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
}
