import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { GraphicInspectorViewProvider } from '../graphic-inspector-view-provider';
import debuggerService from '../debugger-service';

suite('GraphicInspectorViewProvider Tests', () => {
	let provider: GraphicInspectorViewProvider;
	let extensionUri: vscode.Uri;
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
		extensionUri = vscode.Uri.file('/test');
		provider = new GraphicInspectorViewProvider(extensionUri, 0);
	});

	teardown(() => {
		sandbox.restore();
	});

	test('resolveWebviewView generates HTML with inspector toolbar and inputs', () => {
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: () => ({ dispose: () => {} }),
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri,
			cspSource: 'test-csp'
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		assert.ok(mockWebview.html.includes('inspector-screen-toolbar'));
		assert.ok(mockWebview.html.includes('inspector-screen-address-input'));
		assert.ok(mockWebview.html.includes('inspector-palette-address-input'));
		// suggestion container present
		assert.ok(mockWebview.html.includes('symbol-list'));
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

	test('onDidReceiveMessage handles initialize message', async () => {
		const postMessageSpy = sandbox.spy();
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'initialize' });
				return { dispose: () => {} };
			},
			postMessage: postMessageSpy,
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		// wait for async initialize handler
		await new Promise(resolve => setTimeout(resolve, 0));

		assert.ok(postMessageSpy.calledOnce);
		assert.strictEqual(postMessageSpy.firstCall.args[0].type, 'initialize');
	});

	test('onDidReceiveMessage handles contextSelection message', () => {
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'contextSelection', selection: 'inspector-selection' });
				return { dispose: () => {} };
			},
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		assert.strictEqual(provider.getLastContextSelection(), 'inspector-selection');
	});

	test('onDidReceiveMessage forwards other messages to debuggerService', () => {
		const onDidReceiveMessageSpy = sandbox.spy(debuggerService, 'onDidReceiveMessage');
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'readMemory', address: 0x3000 });
				return { dispose: () => {} };
			},
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		assert.ok(onDidReceiveMessageSpy.called);
		assert.strictEqual(onDidReceiveMessageSpy.firstCall.args[1].type, 'readMemory');
		assert.strictEqual(onDidReceiveMessageSpy.firstCall.args[1].address, 0x3000);
	});
});