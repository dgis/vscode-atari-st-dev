//
// VSCODE-ATARI-ST-DEV - graphic-inspector-view-provider.ts
//
// This file is distributed under the GNU General Public License, version 3
// or at your option any later version. Read the file gpl.txt for details.
//
// This file shows the "Memory" views (Memory1, Memory2, Memory3 and Memory4).

// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getNonce, makeDeferred } from "./util";
import debuggerService, { DebuggerContext } from "./debugger-service";

export class GraphicInspectorViewProvider implements vscode.WebviewViewProvider {

	private debug = false;
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

		this.view.webview.onDidReceiveMessage(async data => {
			if (!data) return;
			if (data.type === "initialize") {
				const symbols = await debuggerService.getSymbols();
				this.debuggerContext.postMessageView.postMessage({
					type: "initialize",
					debugSessionStarted: vscode.debug.activeDebugSession?.type === "cppdbg",
					symbols
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
			this.debug && console.log(`GraphicInspectorViewProvider::onDidReceiveDebugSessionCustomEvent(${JSON.stringify(event, null, '\t')})`);
		});
		vscode.debug.onDidTerminateDebugSession((session: vscode.DebugSession) => {
			if (session.type === "cppdbg") {
				this.view?.webview.postMessage({ type: "debugSessionEnded" });
			}
		});
		vscode.debug.onDidChangeActiveStackItem(async (event: any) => {
			this.debug && console.log(`GraphicInspectorViewProvider::onDidChangeActiveStackItem(${JSON.stringify(event, null, '\t')})`);
			if (event?.session && event.session.type === "cppdbg") {
				const symbols = await debuggerService.getSymbols();
				this.view?.webview.postMessage({ type: "debugSessionUpdated", symbols });
			}
		});
	}

	public async showInMemory(address?: number) {
		if (!this.view)
			this.deferredView = makeDeferred<vscode.WebviewView>();
		await vscode.commands.executeCommand(`atariSTDev.graphicInspectorView${this.index}.focus`);
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
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "graphic-inspector-view.js"));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
		const styleViewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "graphic-inspector-view.css"));

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
				<fieldset class="inspector-screen-toolbar">
					<input class="inspector-screen-address-input" placeholder="Screen address or symbol (0xf8000)" title="Screen address or symbol (0xf8000)" type="text" list="symbolList">
					<datalist id="symbolList"></datalist>
					<select class="inspector-format-select" title="Depth (4 low, 2 medium, 1 monochrome)">
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="4" selected>4</option>
					</select>
					<input class="inspector-bytes-per-line-input" placeholder="Bytes/line (160)" title="Bytes/line (160)" type="text">
					<input class="inspector-height-input" placeholder="Height (200)" title="Height (200)" type="text">
				</fieldset>
				<div class="inspector-screen-container">
					<canvas class="inspector-screen-canvas" width="320" height="200"></canvas>
				</div>
				<fieldset class="inspector-palette-toolbar">
					<input class="inspector-palette-address-input" placeholder="Palette address or symbol (0xffff8240)" title="Palette address or symbol (0xffff8240)" type="text" list="symbolList">
				</fieldset>
				<div class="inspector-palette-container">
					<canvas class="inspector-palette-canvas" width="128" height="8"></canvas>
				</div>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
