// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getNonce } from "./util";
import debuggerService, { DebuggerContext } from "./debugger-service";

export class CPUViewProvider implements vscode.WebviewViewProvider {

	private debug = true;
	private view?: vscode.WebviewView;
	private debuggerContext: DebuggerContext = new DebuggerContext;
	private lastContextSelection?: string;
	//private deferredView: any | null = null;

	constructor(
		private readonly _extensionUri: vscode.Uri
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
				// if (this.deferredView) {
				// 	this.deferredView.resolve(this.view);
				// }
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
			this.debug && console.log(`CPUViewProvider::onDidReceiveDebugSessionCustomEvent(${JSON.stringify(event, null, '\t')})`);
		});
		vscode.debug.onDidTerminateDebugSession((session: vscode.DebugSession) => {
			if (session.type === "cppdbg") {
				this.view?.webview.postMessage({ type: "debugSessionEnded" });
			}
		});
		vscode.debug.onDidChangeActiveStackItem((event: any) => {
			this.debug && console.log(`CPUViewProvider::onDidChangeActiveStackItem(${JSON.stringify(event, null, '\t')})`);
			if (event.session && event.session.type === "cppdbg") {
				this.view?.webview.postMessage({ type: "debugSessionUpdated" });
			}
		});
	}

	// public async showInMemory(address?: number) {
	// 	if (!this.view)
	// 		this.deferredView = makeDeferred<vscode.WebviewView>();
	// 	await vscode.commands.executeCommand(`atariSTDev.memoryView${this.index}.focus`);
	// 	if (!this.view)
	// 		await this.deferredView.promise;
	// 	if (this.view) {
	// 		this.view?.webview.postMessage({ type: "showInMemory", address } );
	// 	}
	// }

	public getLastContextSelection(): string | undefined {
		return this.lastContextSelection;
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "cpu-view.js"));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
		const styleViewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "cpu-view.css"));

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

				<title>Atari ST: CPU</title>
			</head>
			<body>
				<div class="cpureg" tabindex="0" data-vscode-context='{"webviewSection": "cpureg"}'>
					<div class="cpureg-disabled">
						<p>No active debugging session.</p>
					</div>
					<div class="cpureg-active" style="display: none;">
						<div class="cpu" data-vscode-context='{"webviewSection": "cpu"}'>
							PC: <span class="pc highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							SR: <span class="sr"></span><br>
							<br>
							&gt;&gt;&nbsp;<span class="nextInstruction"></span>
						</div>
						<div class="registers" data-vscode-context='{"webviewSection": "registers"}'>
							D0: <span class="d0 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A0: <span class="a0 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D1: <span class="d1 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A1: <span class="a1 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D2: <span class="d2 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A2: <span class="a2 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D3: <span class="d3 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A3: <span class="a3 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D4: <span class="d4 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A4: <span class="a4 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D5: <span class="d5 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A5: <span class="a5 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D6: <span class="d6 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A6: <span class="a6 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							D7: <span class="d7 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span> &nbsp; A7: <span class="a7 highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							USP: <span class="usp highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
							ISP: <span class="isp highlight-on-hover" data-vscode-context='{"webviewSection": "to-memory-view"}'></span><br>
						</div>
						<div class="hatari" data-vscode-context='{"webviewSection": "hatari"}'>
							VBL: <span class="vbl"></span><br>
							HBL: <span class="hbl"></span><br>
						</div>
					</div>
				</div>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
