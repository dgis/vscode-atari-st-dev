// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import { CPUViewProvider } from "./cpu-view-provider";
import { HardwareTreeviewProvider } from "./hardware-treeview-provider";
import { MemoryViewProvider } from "./memory-view-provider";

let isExtensionActivated = false;
let ATARIST_TOOLS: string;

function getVscodePlatform(): "windows" | "linux" | "osx" {
  switch (process.platform) {
    case "win32": return "windows";
    case "darwin": return "osx";
    case "linux": return "linux";
    default: return "linux";
  }
}

async function setEnvironmentPath(context: vscode.ExtensionContext) {
	ATARIST_TOOLS = path.join(context.extensionPath, "sdk", process.platform);

	// Update internal PATHs
	for (const workspaceFolder of vscode.workspace.workspaceFolders || []) {
		const col = context.environmentVariableCollection.getScoped({ workspaceFolder });
		let PATH: string | undefined = col.get("PATH")?.value;
		if (process.platform === "win32") {
			const toolsDir = `${ATARIST_TOOLS}\\bin;${ATARIST_TOOLS}\\opt\\cross-mint\\bin;${ATARIST_TOOLS}\\opt\\cross-mint\\m68k-atari-mintelf\\bin;C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem`;
			if (!(PATH && PATH.includes(toolsDir)))
				col.prepend("PATH", toolsDir + ";");
		} else {
			const toolsDir = `${ATARIST_TOOLS}/bin:${ATARIST_TOOLS}/opt/cross-mint/bin:${ATARIST_TOOLS}/opt/cross-mint/m68k-atari-mintelf/bin`;
			if (!(PATH && PATH.includes(toolsDir)))
				col.prepend("PATH", toolsDir + ":");
		}
		col.replace("ATARIST_TOOLS", ATARIST_TOOLS);
		//col.persistent = true;
	}

	// Update workspace PATHs (saved in .vscode/settings.json)
	const terminalIntegratedEnv = `terminal.integrated.env.${getVscodePlatform()}`;
	for (const workspaceFolder of vscode.workspace.workspaceFolders || []) {
		const config = vscode.workspace.getConfiguration(undefined, workspaceFolder.uri);
		const current = config.get<Record<string,string> | undefined>(terminalIntegratedEnv);
		let PATH = current?.PATH;
		if (process.platform === "win32") {
			const toolsDir = `${ATARIST_TOOLS}\\bin;${ATARIST_TOOLS}\\opt\\cross-mint\\bin;${ATARIST_TOOLS}\\opt\\cross-mint\\m68k-atari-mintelf\\bin;C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem`;
			if (!(current?.PATH && current.PATH.includes(toolsDir)))
				PATH = current?.PATH ? `${toolsDir};${current.PATH}` : toolsDir;
		} else {
			const toolsDir = `${ATARIST_TOOLS}/bin:${ATARIST_TOOLS}/opt/cross-mint/bin:${ATARIST_TOOLS}/opt/cross-mint/m68k-atari-mintelf/bin`;
			if (!(current?.PATH && current.PATH.includes(toolsDir)))
				PATH = current?.PATH ? `${toolsDir}:${current.PATH}` : toolsDir;
		}
		const newEnv = {
			...(current || {}),
			PATH,
			ATARIST_TOOLS
		};
		await config.update("atariSTDev.activate", true, vscode.ConfigurationTarget.Workspace);
		await config.update("atariSTDev.path", ATARIST_TOOLS, vscode.ConfigurationTarget.Workspace);
		await config.update(terminalIntegratedEnv, newEnv, vscode.ConfigurationTarget.Workspace);
	}
}

async function activateExtension(context: vscode.ExtensionContext) {

	await setEnvironmentPath(context);

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

	vscode.commands.executeCommand("setContext", "atariSTDev.showDebugViews", true);
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand("atariSTDev.tools", async () => {
		if (!isExtensionActivated) {
			await activateExtension(context);
		}
		return ATARIST_TOOLS;
	}));

	for (const workspaceFolder of vscode.workspace.workspaceFolders || []) {
		const config0 = vscode.workspace.getConfiguration("atariSTDev", workspaceFolder.uri);
		if (config0.get<boolean>("activate", false)) {
			isExtensionActivated = true;
			break;
		}
	}
    if (isExtensionActivated) {
        activateExtension(context);
    } else {
		// Listen for configuration changes to activate the extension
		let didChangeConfigurationSubscription = vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration("atariSTDev.activate")) {
				for (const workspaceFolder of vscode.workspace.workspaceFolders || []) {
					const config0 = vscode.workspace.getConfiguration("atariSTDev", workspaceFolder.uri);
					if (config0.get<boolean>("activate", false)) {
						isExtensionActivated = true;
						// Activate the extension only the first time the setting is changed to true.
						activateExtension(context);
						break;
					}
				}
			}
			if (isExtensionActivated) {
				// Dispose the listener once the extension is activated
				didChangeConfigurationSubscription.dispose();
			}
		});
	}
}

// This method is called when your extension is deactivated
export function deactivate() {

}
