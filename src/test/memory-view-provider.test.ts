import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { MemoryViewProvider } from '../memory-view-provider';
import debuggerService from '../debugger-service';

suite('MemoryViewProvider Tests', () => {
	let provider: MemoryViewProvider;
	let extensionUri: vscode.Uri;
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
		extensionUri = vscode.Uri.file('/test');
		provider = new MemoryViewProvider(extensionUri, 0);
	});

	teardown(() => {
		sandbox.restore();
	});

	test('constructor initializes with extension URI and index', () => {
		assert.ok(provider);
		assert.strictEqual(provider.index, 0);
	});

	test('getLastContextSelection returns undefined initially', () => {
		const selection = provider.getLastContextSelection();
		assert.strictEqual(selection, undefined);
	});



	test('refreshMemory handles no view gracefully', async () => {
		await provider.refreshMemory();
		assert.ok(true); // Should not throw
	});

	test('refreshMemory posts message when view exists', async () => {
		const postMessageSpy = sandbox.spy();
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: () => ({ dispose: () => {} }),
			postMessage: postMessageSpy,
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
		await provider.refreshMemory();

		assert.ok(postMessageSpy.calledWith({ type: 'refreshMemory' }));
	});

	test('resolveWebviewView sets up webview options', () => {
		const mockWebview1: any = {
			options: {},
			html: '',
			onDidReceiveMessage: () => ({ dispose: () => {} }),
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView1: any = { webview: mockWebview1 };

		provider.resolveWebviewView(mockWebviewView1, {} as any, {} as any);

		assert.strictEqual(mockWebview1.options.enableScripts, true);
		assert.ok(mockWebview1.html.includes('<!DOCTYPE html>'));
	});

	test('resolveWebviewView generates HTML with memory toolbar', () => {
		const mockWebview2: any = {
			options: {},
			html: '',
			onDidReceiveMessage: () => ({ dispose: () => {} }),
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri,
			cspSource: 'test-csp'
		};
		const mockWebviewView2: any = { webview: mockWebview2 };

		provider.resolveWebviewView(mockWebviewView2, {} as any, {} as any);

		assert.ok(mockWebview2.html.includes('memory-toolbar'));
		assert.ok(mockWebview2.html.includes('memory-address-input'));
		assert.ok(mockWebview2.html.includes('memory-column-select'));
	// New: symbol suggestion container should be present and datalist removed
	assert.ok(mockWebview2.html.includes('symbol-list'));
	assert.ok(!mockWebview2.html.includes('<datalist'));
	});

	test('onDidReceiveMessage handles initialize message', async () => {
		const postMessageSpy = sandbox.spy();
		const mockWebview3: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'initialize' });
				return { dispose: () => {} };
			},
			postMessage: postMessageSpy,
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView3: any = { webview: mockWebview3 };

		provider.resolveWebviewView(mockWebviewView3, {} as any, {} as any);

		// wait for async initialize handler
		await new Promise(resolve => setTimeout(resolve, 0));

		assert.ok(postMessageSpy.calledOnce);
		assert.strictEqual(postMessageSpy.firstCall.args[0].type, 'initialize');
	});

	test('onDidReceiveMessage handles contextSelection message', () => {
		const mockWebview4: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'contextSelection', selection: 'memory-selection' });
				return { dispose: () => {} };
			},
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView4: any = { webview: mockWebview4 };

		provider.resolveWebviewView(mockWebviewView4, {} as any, {} as any);

		assert.strictEqual(provider.getLastContextSelection(), 'memory-selection');
	});

	test('onDidReceiveMessage forwards other messages to debuggerService', () => {
		const onDidReceiveMessageSpy = sandbox.spy(debuggerService, 'onDidReceiveMessage');
		const mockWebview5: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'readMemory', address: 0x2000 });
				return { dispose: () => {} };
			},
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView5: any = { webview: mockWebview5 };

		provider.resolveWebviewView(mockWebviewView5, {} as any, {} as any);

		assert.ok(onDidReceiveMessageSpy.called);
		assert.strictEqual(onDidReceiveMessageSpy.firstCall.args[1].type, 'readMemory');
		assert.strictEqual(onDidReceiveMessageSpy.firstCall.args[1].address, 0x2000);
	});

	test('constructor with different index values', () => {
		const provider1 = new MemoryViewProvider(extensionUri, 1);
		const provider2 = new MemoryViewProvider(extensionUri, 2);
		
		assert.strictEqual(provider1.index, 1);
		assert.strictEqual(provider2.index, 2);
	});
});