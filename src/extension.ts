// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CPUViewProvider } from "./cpu-view-provider";
import { HardwareTreeviewProvider } from "./hardware-treeview-provider";
import { MemoryViewProvider } from "./memory-view-provider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.window.registerTreeDataProvider("atariSTDev.hardwareView", new HardwareTreeviewProvider(context)));

	const providers = new Map<string, vscode.WebviewViewProvider>();
	providers.set("atariSTDev.CPUView", new CPUViewProvider(context.extensionUri));
	providers.set("atariSTDev.memoryView1", new MemoryViewProvider(context.extensionUri, 1));
	providers.set("atariSTDev.memoryView2", new MemoryViewProvider(context.extensionUri, 2));
	providers.set("atariSTDev.memoryView3", new MemoryViewProvider(context.extensionUri, 3));
	providers.set("atariSTDev.memoryView4", new MemoryViewProvider(context.extensionUri, 4));
	providers.forEach((provider, viewId) => {
		context.subscriptions.push(vscode.window.registerWebviewViewProvider(viewId, provider));
		if (provider instanceof MemoryViewProvider) {
			const memoryViewProvider = provider as MemoryViewProvider;
			context.subscriptions.push(vscode.commands.registerCommand(`atariSTDev.showInMemory${memoryViewProvider.index}`, itemContext => {
				const sourceProvider = providers.get(itemContext.webview) as MemoryViewProvider | undefined;
				let addressString = itemContext?.variable?.memoryReference || itemContext?.value;
				if (!addressString) {
					if (sourceProvider)
						addressString = sourceProvider.getLastContextSelection();
				}
				if (addressString)
					memoryViewProvider.showInMemory(parseInt(addressString, 16));
			}));
			context.subscriptions.push(vscode.commands.registerCommand(`atariSTDev.refreshMemory${memoryViewProvider.index}`, () => {
				memoryViewProvider.refreshMemory();
			}));
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate() {

}
