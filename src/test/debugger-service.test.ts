import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { DebuggerContext } from '../debugger-service';
import debuggerService from '../debugger-service';

suite('DebuggerService Tests', () => {
	let mockDebugSession: any;
	let context: DebuggerContext;
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
		mockDebugSession = {
			customRequest: async (command: string, args?: any) => {
				if (command === 'readMemory') {
					return { address: '1000', data: btoa('test') };
				}
				if (command === 'evaluate') {
					return { result: 'mock result' };
				}
				return {};
			}
		};
		context = new DebuggerContext();
		context.postMessageView = { postMessage: () => {} };
	});

	teardown(() => {
		sandbox.restore();
	});

	test('DebuggerContext can be instantiated', () => {
		const ctx = new DebuggerContext();
		assert.ok(ctx);
		assert.strictEqual(ctx.postMessageView, undefined);
	});

	test('DebuggerContext postMessageView can be set', () => {
		const ctx = new DebuggerContext();
		const mockView = { postMessage: () => {} };
		ctx.postMessageView = mockView;
		assert.strictEqual(ctx.postMessageView, mockView);
	});

	test('onDidReceiveMessage handles readMemory', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		
		const readMemorySpy = sandbox.spy(debuggerService, 'readMemory');
		const postMessageSpy = sandbox.spy();
		context.postMessageView = { postMessage: postMessageSpy };
		
		const data = { type: 'readMemory', address: 0x1000, offset: 0, count: 4 };
		await debuggerService.onDidReceiveMessage(context, data);
		
		assert.ok(readMemorySpy.calledOnce);
		assert.ok(readMemorySpy.calledWith(0x1000, 0, 4));
		assert.ok(postMessageSpy.calledOnce);
		assert.strictEqual(postMessageSpy.firstCall.args[0].type, 'memoryRead');
		assert.strictEqual(postMessageSpy.firstCall.args[0].address, 4096);
	});

	test('onDidReceiveMessage handles writeMemory', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		(debuggerService as any).currentFrameId = 'frame1';
		
		const writeMemorySpy = sandbox.spy(debuggerService, 'writeMemory');
		const postMessageSpy = sandbox.spy();
		context.postMessageView = { postMessage: postMessageSpy };
		
		const data = { type: 'writeMemory', address: 0x1000, data: 'test' };
		await debuggerService.onDidReceiveMessage(context, data);
		
		assert.ok(writeMemorySpy.calledOnce);
		assert.ok(writeMemorySpy.calledWith(0x1000, 'test'));
		assert.ok(postMessageSpy.calledOnce);
		assert.strictEqual(postMessageSpy.firstCall.args[0].type, 'memoryWritten');
	});

	test('onDidReceiveMessage handles readCPURegisters', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		(debuggerService as any).currentFrameId = 'frame1';
		
		const evaluateGDBCommandSpy = sandbox.spy(debuggerService, 'evaluateGDBCommand');
		const postMessageSpy = sandbox.spy();
		context.postMessageView = { postMessage: postMessageSpy };
		
		const data = { type: 'readCPURegisters' };
		await debuggerService.onDidReceiveMessage(context, data);
		
		assert.strictEqual(evaluateGDBCommandSpy.callCount, 2);
		assert.ok(evaluateGDBCommandSpy.firstCall.calledWith('-exec monitor cpureg'));
		assert.ok(evaluateGDBCommandSpy.secondCall.calledWith('-exec monitor info video'));
		assert.ok(postMessageSpy.calledOnce);
		assert.strictEqual(postMessageSpy.firstCall.args[0].type, 'cpuRegistersRead');
		assert.strictEqual(postMessageSpy.firstCall.args[0].registers, 'mock resultmock result');
	});

	test('onDidReceiveMessage returns early with no context', async () => {
		const result = await debuggerService.onDidReceiveMessage(null as any, {});
		assert.strictEqual(result, undefined);
	});

	test('readMemory returns response when debug session active', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		
		const result = await debuggerService.readMemory(0x1000, 0, 4);
		
		assert.ok(result);
		assert.strictEqual(result.address, 4096);
	});

	test('readMemory returns undefined when no debug session', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(undefined);
		
		const result = await debuggerService.readMemory(0x1000, 0, 4);
		
		assert.strictEqual(result, undefined);
	});

	test('writeMemory returns response when debug session active', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		(debuggerService as any).currentFrameId = 'frame1';
		
		const result = await debuggerService.writeMemory(0x1000, 'test');
		
		assert.ok(result);
	});

	test('writeMemory returns undefined when no debug session', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(undefined);
		
		const result = await debuggerService.writeMemory(0x1000, 'test');
		
		assert.strictEqual(result, undefined);
	});

	test('evaluateGDBCommand returns result when conditions met', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		(debuggerService as any).currentFrameId = 'frame1';
		
		const result = await debuggerService.evaluateGDBCommand('test command');
		
		assert.strictEqual(result, 'mock result');
	});

	test('evaluateGDBCommand returns empty string when no frameId', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(mockDebugSession);
		(debuggerService as any).currentFrameId = '';
		
		const result = await debuggerService.evaluateGDBCommand('test command');
		
		assert.strictEqual(result, '');
	});

	test('evaluateGDBCommand returns empty string when no debug session', async () => {
		sandbox.stub(vscode.debug, 'activeDebugSession').value(undefined);
		(debuggerService as any).currentFrameId = 'frame1';
		
		const result = await debuggerService.evaluateGDBCommand('test command');
		
		assert.strictEqual(result, '');
	});
});