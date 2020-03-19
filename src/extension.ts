import { window, DecorationRangeBehavior, Range, workspace } from 'vscode';
import * as pairify from 'pairify';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

import { EVENTS, TOOLTIP_COLOR, TOOLTIP_SHOW_INTERVAL } from './constants';

let client: LanguageClient;
let clientReady = false;
let decorations = [];
let tooltipDecoration = null;
let tooltipShowDecorationInterval;

function showEndLineTooltip(line, text) {
	line -= 1;
	const textEditor = window.activeTextEditor;
	const code = textEditor.document.getText();
	const lineText = code.split('\n')[line];
	if (typeof lineText === 'undefined') {
		console.log(`Kalia: no line #${line}`);
		return;
	}
	const lineLength = code.split('\n')[line].length;
	const decoration = window.createTextEditorDecorationType({
		after: {
			contentText: text,
			color: TOOLTIP_COLOR
		}
	});
	
	if (tooltipShowDecorationInterval) {
		clearTimeout(tooltipShowDecorationInterval);
	}
	if (tooltipDecoration) {
		tooltipDecoration.dispose();
	}
	tooltipShowDecorationInterval = setTimeout(() => {
		textEditor.setDecorations(decoration, [new Range(line, 0, line, lineLength)]);
		tooltipDecoration = decoration;
	}, TOOLTIP_SHOW_INTERVAL);
}
function clearDecorations() {
	if (decorations.length > 0) {
		decorations.forEach(d => d.dispose());
		decorations = [];
	}
	if (tooltipDecoration) {
		tooltipDecoration.dispose();
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
		console.log('ready');
		clientReady = true;
		client.onNotification(EVENTS.ANALYSIS, ({ analysis, line }) => {
			if (analysis.breadcrumbs && analysis.breadcrumbs.length > 1) {
				showEndLineTooltip(
					line, `  ${analysis.breadcrumbs.join('·')}`
				);
			}
		});
	});
}

function activate(context) {
	startServer(context);
	window.onDidChangeTextEditorSelection(event => {
		const code = window.activeTextEditor.document.getText();
		clearDecorations();
		const selection = event.selections[0];
		if (selection && selection.start && event.textEditor.document === window.activeTextEditor.document) {
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
