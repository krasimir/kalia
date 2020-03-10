const vscode = require('vscode');
const pairify = require('pairify');

const decorations = [];

function activate(context) {
	console.log('Kalia extension is activated');
	vscode.window.onDidChangeTextEditorSelection(event => {
		if (decorations.length > 0) {
			decorations.forEach(d => d.dispose())
		}
		const selection = event.selections[0];
		if (selection && selection.start) {
			const code = event.textEditor.document.getText();
			const pairs = pairify
				.match(code, selection.start.line + 1, selection.start.character + 1)
				.filter(({ type }) => type === 'curly');
			if (pairs.length > 0) {
				const pair = pairs.pop();
				const decoration = vscode.window.createTextEditorDecorationType({
					rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
					backgroundColor: "#f0f"
				});
				event.textEditor.setDecorations(decoration, [new vscode.Range(pair.from[0]-1, pair.from[1]-1, pair.to[0]-1, pair.to[1]-1)]);
				decorations.push(decoration);
			}
		}
	});
}

function deactivate() {
	console.log('Kalia extension is deactivated');
}
 
module.exports = {
	activate,
	deactivate
}
