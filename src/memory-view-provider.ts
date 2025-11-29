// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getNonce, makeDeferred } from "./util";
import debuggerService, { DebuggerContext } from "./debugger-service";

export class MemoryViewProvider implements vscode.WebviewViewProvider {

	private debug = true;
	private view?: vscode.WebviewView;
	private debuggerContext: DebuggerContext = new DebuggerContext;
	private lastContextSelection?: string;
	private deferredView: any | null = null;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		public readonly index: number		
	) {

	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this.view = webviewView;
		this.debuggerContext.postMessageView = this.view?.webview;

		this.view.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		this.view.webview.html = this._getHtmlForWebview(this.view.webview);

		this.view.webview.onDidReceiveMessage(data => {
			if (data.type === "initialize") {
				this.debuggerContext.postMessageView.postMessage({
					type: "initialize",
					debugSessionStarted: vscode.debug.activeDebugSession?.type === "cppdbg"
				});
				if (this.deferredView) {
					this.deferredView.resolve(this.view);
				}
			} else if (data.type === "contextSelection") {
				this.lastContextSelection = data.selection;
			} else
				debuggerService.onDidReceiveMessage(this.debuggerContext, data);
		});

		vscode.debug.onDidStartDebugSession((session: vscode.DebugSession) => {
			if (session.type === "cppdbg") {
				this.view?.webview.postMessage({ type: "debugSessionStarted" });
			}
		});
		vscode.debug.onDidReceiveDebugSessionCustomEvent((event: vscode.DebugSessionCustomEvent) => {
			this.debug && console.log(`MemoryViewProvider::onDidReceiveDebugSessionCustomEvent(${JSON.stringify(event, null, '\t')})`);
		});
		vscode.debug.onDidTerminateDebugSession((session: vscode.DebugSession) => {
			if (session.type === "cppdbg") {
				this.view?.webview.postMessage({ type: "debugSessionEnded" });
			}
		});
		vscode.debug.onDidChangeActiveStackItem((event: any) => {
			this.debug && console.log(`MemoryViewProvider::onDidChangeActiveStackItem(${JSON.stringify(event, null, '\t')})`);
			if (event.session && event.session.type === "cppdbg") {
				this.view?.webview.postMessage({ type: "debugSessionUpdated" });
			}
		});
	}

	public async showInMemory(address?: number) {
		if (!this.view)
			this.deferredView = makeDeferred<vscode.WebviewView>();
		await vscode.commands.executeCommand(`atariSTDev.memoryView${this.index}.focus`);
		if (!this.view)
			await this.deferredView.promise;
		if (this.view) {
			this.view?.webview.postMessage({ type: "showInMemory", address } );
		}
	}

	public async refreshMemory() {
		if (this.view) {
			this.view?.webview.postMessage({ type: "refreshMemory" } );
		}
	}

	public getLastContextSelection(): string | undefined {
		return this.lastContextSelection;
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "memory-view.js"));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
		const styleViewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "memory-view.css"));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<!--meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource};"-->


				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleViewUri}" rel="stylesheet">

				<title>Memory</title>
			</head>
			<body>
				<fieldset class="memory-toolbar">
					<input class="memory-address-input" placeholder="Enter address in hexa" type="text">
					<select class="memory-column-select">
						<option value="auto" selected>Auto</option>
						<option value="2">2</option>
						<option value="4">4</option>
						<option value="8">8</option>
						<option value="16">16</option>
						<option value="32">32</option>
						<option value="64">64</option>
					</select>
				</fieldset>
				<div class="memory-dump" tabindex="0" data-vscode-context='{"webviewSection": "to-memory-view"}'></div>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
