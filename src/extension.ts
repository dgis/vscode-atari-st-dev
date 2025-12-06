// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from 'path';
import { CPUViewProvider } from "./cpu-view-provider";
import { HardwareTreeviewProvider } from "./hardware-treeview-provider";
import { MemoryViewProvider } from "./memory-view-provider";

function getVscodePlatform(): 'windows' | 'linux' | 'osx' {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'osx';
    case 'linux': return 'linux';
    default: return 'linux';
  }
}

async function setEnvironmentPath(context: vscode.ExtensionContext) {
	const ATARIST_TOOLS = path.join(context.extensionPath, 'sdk', process.platform);

	// Update internal PATHs
	// const col = context.environmentVariableCollection;
	// let PATH: string | undefined = col.get('PATH')?.value;
	// if (process.platform === "win32") {
	// 	const toolsDir = `${ATARIST_TOOLS}\\bin;${ATARIST_TOOLS}\\opt\\cross-mint\\bin;${ATARIST_TOOLS}\\opt\\cross-mint\\m68k-atari-mintelf\\bin;C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem`;
	// 	if (!(PATH && PATH.includes(toolsDir)))
	// 		col.prepend('PATH', toolsDir + ';');
	// } else {
	// 	const toolsDir = `${ATARIST_TOOLS}/bin:${ATARIST_TOOLS}/opt/cross-mint/bin:${ATARIST_TOOLS}/opt/cross-mint/m68k-atari-mintelf/bin`;
	// 	if (!(PATH && PATH.includes(toolsDir)))
	// 		col.prepend('PATH', toolsDir + ':');
	// }
	// col.replace('ATARIST_TOOLS', ATARIST_TOOLS);
	// col.persistent = true;


	// Update workspace PATHs (saved in .vscode/settings.json)
	const terminalIntegratedEnv = `terminal.integrated.env.${getVscodePlatform()}`;
	const cfg = vscode.workspace.getConfiguration();

	const current = cfg.get<Record<string,string> | undefined>(terminalIntegratedEnv);
	let PATH: string | undefined = current?.PATH;
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
	await cfg.update(terminalIntegratedEnv, newEnv, vscode.ConfigurationTarget.Workspace);
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

	vscode.commands.executeCommand('setContext', 'atariSTDev.showDebugViews', true);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration("atariSTDev");
	const isExtensionActivated = config.get<boolean>("activate", false);

	if (!isExtensionActivated) {
		let didChangeConfigurationSubscription = vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('atariSTDev.activate')) {
				const config0 = vscode.workspace.getConfiguration("atariSTDev");
				if (config0.get<boolean>("activate", false)) {
					// Activate the extension only the first time the setting is changed to true.
					activateExtension(context);
					didChangeConfigurationSubscription.dispose();
				}
			}
		});

		return;  // Exit activation early
	}

	activateExtension(context);
}

// This method is called when your extension is deactivated
export function deactivate() {

}
