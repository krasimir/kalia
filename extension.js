const vscode = require('vscode');

function activate(context) {
	console.log('Kalia extension is activated');
	vscode.window.onDidChangeTextEditorSelection(event => {
		// console.log(event.selections);
		const code = event.textEditor.document.getText();
	// 	const decoration = vscode.window.createTextEditorDecorationType({
	// 		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	// 		backgroundColor: "#f0f"
	// 	});
	// 	event.textEditor.setDecorations(decoration, [new vscode.Range(0, 1, 3, 10)]);
	});
}

function deactivate() {
	console.log('Kalia extension is deactivated');
}
 
module.exports = {
	activate,
	deactivate
}
