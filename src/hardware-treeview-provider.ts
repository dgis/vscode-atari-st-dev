import * as vscode from "vscode";
import debuggerService from "./debugger-service";
import { asciiToHexa } from "./util";

class HardwareTreeElement {
	id: string = "";
	label: string = "";
	description?: string = "";
	value?: string = "";
	children?: HardwareTreeElement[] = [];
	address?: number = 0;
}

const hardwareTree: HardwareTreeElement[] = [
	{
		id: "vectors",
		label: "Vectors",
		value: "",
		children: [
			{
				id: "exceptionVectors",
				label: "Exception Vectors",
				children: [
					{
						id: "busError",
						label: "Bus Error",           
						address: 0x8
					},
					{
						id: "addressEror",
						label: "Address Eror",        
						address: 0xc
					},
					{
						id: "illegalInstruction",
						label: "Illegal Instruction", 
						address: 0x10
					},
					{
						id: "zeroDivide",
						label: "Zero Divide",         
						address: 0x14
					},
					{
						id: "chkChk2",
						label: "CHK/CHK2",            
						address: 0x18
					},
					{
						id: "traPccTrapv",
						label: "TRAPcc, TRAPV",       
						address: 0x1c
					},
					{
						id: "privilegeViolation",
						label: "Privilege Violation", 
						address: 0x20
					},
					{
						id: "trace",
						label: "Trace",               
						address: 0x24
					},
					{
						id: "lineA",
						label: "Line-A",              
						address: 0x28
					},
					{
						id: "lineF",
						label: "Line-F",              
						address: 0x2c
					},
					{
						id: "spuriousInterrupt",
						label: "Spurious Interrupt",  
						address: 0x60
					},
				]
			},
			{
				id: "autoVectors",
				label: "Auto-Vectors",
				children: [
					{
						id: "hbl",
						label: "HBL",
						address: 0x68
					},
					{
						id: "vbl",
						label: "VBL",
						address: 0x68
					}
				]
			},
			{
				id: "trapVectors",
				label: "Trap Vectors",
				value: "",
				children: [
					{
						id: "trap0",
						label: "Trap #0",             
						address: 0x80
					},
					{
						id: "trap1GemDos",
						label: "Trap #1 (GemDOS)",    
						address: 0x84
					},
					{
						id: "trap2AesVdi",
						label: "Trap #2 (AES/VDI)",   
						address: 0x88
					},
					{
						id: "trap3",
						label: "Trap #3",             
						address: 0x8c
					},
					{
						id: "trap4",
						label: "Trap #4",             
						address: 0x90
					},
					{
						id: "trap5",
						label: "Trap #5",             
						address: 0x94
					},
					{
						id: "trap6",
						label: "Trap #6",             
						address: 0x98
					},
					{
						id: "trap7",
						label: "Trap #7",             
						address: 0x9c
					},
					{
						id: "trap8",
						label: "Trap #8",             
						address: 0xa0
					},
					{
						id: "trap9",
						label: "Trap #9",             
						address: 0xa4
					},
					{
						id: "trap10",
						label: "Trap #10",            
						address: 0xa8
					},
					{
						id: "trap11",
						label: "Trap #11",            
						address: 0xac
					},
					{
						id: "trap12",
						label: "Trap #12",            
						address: 0xb0
					},
					{
						id: "trap13Bios",
						label: "Trap #13 (BIOS)",     
						address: 0xb4
					},
					{
						id: "trap14Xbios",
						label: "Trap #14 (XBIOS)",    
						address: 0xb8
					},
					{
						id: "trap15",
						label: "Trap #15",            
						address: 0xbc
					},
				]
			},
			// {
			// 	id: "mfpVectors",
			// 	label: "MFP Vectors",
			// 	value: "",
			// 	children: []
			// },
		]
	},
	// {
	// 	id: "hardwareConfig",
	// 	label: "Hardware Config",
	// 	value: "RAM, monitor",
	// 	children: []
	// },
	// {
	// 	id: "shifterGlue",
	// 	label: "Shifter/Glue",
	// 	value: "Video",
	// 	children: []
	// },
	// {
	// 	id: "videl",
	// 	label: "VIDEL",
	// 	value: "Falcon Video",
	// 	children: []
	// },
	// {
	// 	id: "mfp_68901",
	// 	label: "MFP 68901",
	// 	value: "Multi-Function Peripheral",
	// 	children: []
	// },
	// {
	// 	id: "ym_2149Psg",
	// 	label: "YM 2149 (PSG)",
	// 	value: "Sound Generator",
	// 	children: []
	// },
	// {
	// 	id: "acia",
	// 	label: "ACIA",
	// 	value: "Keyboard and MIDI",
	// 	children: [] },
	// {
	// 	id: "blitter",
	// 	label: "Blitter",
	// 	value: "",
	// 	children: [
	// 		{
	// 			id: "halftoneRam",
	// 			label: "Halftone RAM",
	// 			value: "",
	// 			children: []
	// 		}
	// 	]
	// },
	// {
	// 	id: "dmaSound",
	// 	label: "DMA Sound",
	// 	value: "",
	// 	children: []
	// }
];


export class HardwareTreeviewProvider implements vscode.TreeDataProvider<HardwareTreeElement> {

	private debug = true;
	private _onDidChangeTreeData: vscode.EventEmitter<HardwareTreeElement | undefined | null | void> = new vscode.EventEmitter<HardwareTreeElement | undefined | null | void>();
    private debuggingActivate = false;

	constructor(
		private readonly context: vscode.ExtensionContext
	) {
		vscode.debug.onDidStartDebugSession((session: vscode.DebugSession) => {
			if (session.type === "cppdbg") {
				this.debuggingActivate = true;
			}
		});
		vscode.debug.onDidTerminateDebugSession((session: vscode.DebugSession) => {
			if (session.type === "cppdbg") {
				this.debuggingActivate = false;
				this.refresh();
			}
		});
		vscode.debug.onDidChangeActiveStackItem((event: any) => {
			this.debug && console.log(`HardwareTreeviewProvider::onDidChangeActiveStackItem(${JSON.stringify(event, null, '\t')})`);
			if (event.session && event.session.type === "cppdbg") {
				this.refresh();
			}
		});

	}

	async refresh(): Promise<void> {
		const updateElements = (elements: HardwareTreeElement[]) => {
			elements.forEach(async (child) => {
				if (this.debuggingActivate) {
					if (child.address) {
						const response = await debuggerService.readMemory(child.address, 0, 4);
						child.value = `0x${asciiToHexa(response.data)}`;
						child.description = `[0x${child.address.toString(16).padStart(2, "0")}] -> ${child.value}`;
						this._onDidChangeTreeData.fire(child);
					}
				} else {
					child.value = "";
					child.description = "";
					this._onDidChangeTreeData.fire(child);
				}
				if (child.children && child.children.length) {
					updateElements(child.children);
				}
			});
		};
		await updateElements(hardwareTree);
	}

	// tree data provider

	readonly onDidChangeTreeData?: vscode.Event<void | HardwareTreeElement | HardwareTreeElement[] | null | undefined> | undefined = this._onDidChangeTreeData.event;

	getTreeItem(element: HardwareTreeElement): vscode.TreeItem | Thenable<vscode.TreeItem> {
		// An example of how to use codicons in a MarkdownString in a tree item tooltip.
		const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${element.id}`, true);
		return {
			label: element.label,
			description: element.description,
			tooltip,
			collapsibleState: element.children?.length ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
			id: element.id
		};
	}
	getChildren(element?: HardwareTreeElement | undefined): HardwareTreeElement[] {
		return element ? element.children ?? [] : hardwareTree;
	}
	getParent?(element: HardwareTreeElement): vscode.ProviderResult<HardwareTreeElement> {
		throw new Error("Method not implemented.");
	}
	resolveTreeItem?(item: vscode.TreeItem, element: HardwareTreeElement, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
		return item;
	}
}
