import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { CPUViewProvider } from '../cpu-view-provider';
import debuggerService from '../debugger-service';

suite('CPUViewProvider Tests', () => {
	let provider: CPUViewProvider;
	let extensionUri: vscode.Uri;
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
		extensionUri = vscode.Uri.file('/test');
		provider = new CPUViewProvider(extensionUri);
	});

	teardown(() => {
		sandbox.restore();
	});

	test('constructor initializes with extension URI', () => {
		assert.ok(provider);
	});

	test('getLastContextSelection returns undefined initially', () => {
		const selection = provider.getLastContextSelection();
		assert.strictEqual(selection, undefined);
	});

	test('resolveWebviewView sets up webview options', () => {
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: () => ({ dispose: () => {} }),
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		assert.strictEqual(mockWebview.options.enableScripts, true);
		assert.ok(mockWebview.html.includes('<!DOCTYPE html>'));
	});

	test('resolveWebviewView generates HTML with nonce', () => {
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

		assert.ok(mockWebview.html.includes('nonce='));
		assert.ok(mockWebview.html.includes('Atari ST: CPU'));
	});

	test('onDidReceiveMessage handles initialize message', () => {
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

		assert.ok(postMessageSpy.calledOnce);
		assert.strictEqual(postMessageSpy.firstCall.args[0].type, 'initialize');
	});

	test('onDidReceiveMessage handles contextSelection message', () => {
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'contextSelection', selection: 'test-selection' });
				return { dispose: () => {} };
			},
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		assert.strictEqual(provider.getLastContextSelection(), 'test-selection');
	});

	test('onDidReceiveMessage forwards other messages to debuggerService', () => {
		const onDidReceiveMessageSpy = sandbox.spy(debuggerService, 'onDidReceiveMessage');
		const mockWebview: any = {
			options: {},
			html: '',
			onDidReceiveMessage: (callback: any) => {
				callback({ type: 'readMemory', address: 0x1000 });
				return { dispose: () => {} };
			},
			postMessage: () => {},
			asWebviewUri: (uri: vscode.Uri) => uri
		};
		const mockWebviewView: any = { webview: mockWebview };

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

		assert.ok(onDidReceiveMessageSpy.called);
		assert.strictEqual(onDidReceiveMessageSpy.firstCall.args[1].type, 'readMemory');
	});
});