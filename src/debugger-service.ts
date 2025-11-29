import * as vscode from "vscode";
import { asciiToHexa } from "./util";

export class DebuggerContext {
	postMessageView?: any;
}

class DebuggerService {

	private currentFrameId = "";

	private debug = true;
	private test = false;
	private testBuffer = "";

	constructor() {
		if (this.test) {
			let ascii = "";
			for (let i = 1; i < 256; i++) {
				ascii += String.fromCharCode(i);
			}
			this.testBuffer = ascii.repeat(4 * 1024 * 4);
		}

		vscode.debug.onDidChangeActiveStackItem((event: any) => {
			this.debug && console.log(`DebuggerService::onDidChangeActiveStackItem(${JSON.stringify(event, null, '\t')})`);
			if (event.session && event.session.type === "cppdbg") {
				this.currentFrameId = event.frameId;
			}
		});
	}

	public async onDidReceiveMessage(context: DebuggerContext, data : any) {
		if (!context) {
			return;
		}
		try {
			switch (data.type) {
				case "readMemory": {
					const response = await this.readMemory(data.address, data.offset, data.count);
					response.type = "memoryRead";
					return context?.postMessageView.postMessage(response);
				}
				case "writeMemory": {
					let response = await this.writeMemory(data.address, data.data);
					response.type = "memoryWritten";
					return context?.postMessageView.postMessage(response);
				}
				case "readCPURegisters": {
					let response = await this.evaluateGDBCommand("-exec monitor cpureg");
					response += await this.evaluateGDBCommand("-exec monitor info video");
					return context?.postMessageView.postMessage({
						type: "cpuRegistersRead",
						registers: response
					});
				}
			}
		} catch (e) {
			this.debug && console.log(`DebuggerService::onDidReceiveMessage() Cannot deal with message type: '${data.type}'`, e);
		}
	}

	public async readMemory(address: number, offset: number, count: number) {
		this.debug && console.log(`DebuggerService::readMemory(address: 0x${address.toString(16)}, offset: ${offset}, count: ${count})`);
		if (!this.test) {
			const activeDebugSession = vscode.debug.activeDebugSession;
			if (activeDebugSession !== undefined) {
				const response = await activeDebugSession.customRequest("readMemory", {
					memoryReference: address,
					offset: offset,
					count: count,
				});
				response.address = parseInt(response.address, 16);
				response.data = atob(response.data);
				this.debug && console.log(`DebuggerService::readMemory(address: 0x${address.toString(16)}, offset: ${offset}, count: ${count}) -> 0x${asciiToHexa(response.data)}`);
				return response;
			} else {
				this.debug && console.log("DebuggerService::readMemory() No valid debugging session is currently running.");
			}
		} else {
			let buffer = this.testBuffer.substring(address, address + count);
			return {
				address: address,
				unreadableBytes: 0,
				data: buffer
			};
		}
	}

	public async writeMemory(address: number, data: string) {
		if (!this.test) {
			const activeDebugSession = vscode.debug.activeDebugSession;
			if (activeDebugSession !== undefined) {
				//-exec set {int[4]}0x601050 = {1, 2, 3, 4}
				//-exec set {char[5]}(0x1b13c) = "ABCDE"
				// // writeMemory(memoryReference: string, offset: number, data: string, allowPartial?: boolean): Promise<DebugProtocol.WriteMemoryResponse | undefined>;
				// let buffer = btoa(data);
				// activeDebugSession.customRequest("writeMemory", {
				// 	memoryReference: address,
				// 	offset: 0,
				// 	data: buffer
				// }).then((response: any) => {
				// 	this.debug && console.log("DebuggerService::Got response", response);
				// 	response.type = "memoryWritten";
				// 	// response.offset?: number; // Property that should be returned when `allowPartial` is true to indicate the offset of the first byte of data successfully written. Can be negative.
				// 	// response.bytesWritten?: number; // Property that should be returned when `allowPartial` is true to indicate the number of bytes starting from address that were successfully written.
				// 	view.postMessage(response);
				// });
				const args = {
					// expression: "-exec set {int[4]}0x601050 = {1, 2, 3, 4}",
					expression: "-exec monitor cpureg",
					frameId: this.currentFrameId,
					context: "repl"
				};
				const response = await activeDebugSession.customRequest("evaluate", args);
				this.debug && console.log("DebuggerService::Got response", response);
				return response;
			} else {
				this.debug && console.log("DebuggerService::writeMemory() No valid debugging session is currently running.");
			}
		} else {
			this.testBuffer = this.testBuffer.substring(0, address) + data + this.testBuffer.substring(address + data.length);
			return {
				offset: 0,
				bytesWritten: data.length
			};
		}
	}

	public async evaluateGDBCommand(gdbCommand: string) : Promise<string> {
		this.debug && console.log(`DebuggerService::evaluateGDBCommand(gdbCommand: "${gdbCommand}")`);
		if (this.currentFrameId) {
			const activeDebugSession = vscode.debug.activeDebugSession;
			if (activeDebugSession !== undefined) {
				try {
					const args = {
						expression: gdbCommand, //"-exec i r",
						frameId: this.currentFrameId,
						context: "repl"
					};
					const response = await activeDebugSession.customRequest("evaluate", args);
					this.debug && console.log(`DebuggerService::evaluateGDBCommand(gdbCommand: "${gdbCommand}") -> ${response.result}`);
					return response.result;
				} catch (e) {
					this.debug && console.error("DebuggerService::evaluateGDBCommand() error: ", e);
				}
			} else {
				this.debug && console.error("DebuggerService::evaluateGDBCommand() No valid debugging session is currently running.");
			}
		} else {
			this.debug && console.error("DebuggerService::evaluateGDBCommand() No valid currentFrameId.");
		}
		return "";
	}
}

export default new DebuggerService;