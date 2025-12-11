import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { HardwareTreeviewProvider } from '../hardware-treeview-provider';
import debuggerService from '../debugger-service';

suite('HardwareTreeviewProvider Tests', () => {
	let provider: HardwareTreeviewProvider;
	let mockContext: vscode.ExtensionContext;
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
		mockContext = {} as vscode.ExtensionContext;
		provider = new HardwareTreeviewProvider(mockContext);
	});

	teardown(() => {
		sandbox.restore();
	});

	test('constructor initializes with context', () => {
		assert.ok(provider);
	});

	test('getChildren returns root elements when no element provided', () => {
		const children = provider.getChildren();
		assert.ok(Array.isArray(children));
		assert.ok(children.length > 0);
		assert.strictEqual(children[0].id, 'vectors');
	});

	test('getTreeItem returns valid tree item', async () => {
		const element = { id: 'test', label: 'Test', children: [] };
		const treeItem = await Promise.resolve(provider.getTreeItem(element));
		assert.ok(treeItem);
		assert.strictEqual(treeItem.label, 'Test');
	});

	test('getParent throws not implemented error', () => {
		const element = { id: 'test', label: 'Test', children: [] };
		assert.throws(() => provider.getParent!(element));
	});

	test('refresh clears values when debugging not active', async () => {
		(provider as any).debuggingActivate = false;
		const children = provider.getChildren();
		const firstChild = children[0].children![0].children![0];
		firstChild.value = 'test';
		firstChild.description = 'test';

		await provider.refresh();

		assert.strictEqual(firstChild.value, '');
		assert.strictEqual(firstChild.description, '');
	});

	test('refresh reads memory when debugging active', async () => {
		(provider as any).debuggingActivate = true;
		const mockResponse = { data: 'test', address: 0x8 };
		const readMemoryStub = sandbox.stub(debuggerService, 'readMemory').resolves(mockResponse);

		await provider.refresh();

		assert.ok(readMemoryStub.called);
	});

	test('refresh updates element values when debugging active', async () => {
		(provider as any).debuggingActivate = true;
		const mockResponse = { data: 'ABCD', address: 0x8 };
		sandbox.stub(debuggerService, 'readMemory').resolves(mockResponse);

		await provider.refresh();

		const children = provider.getChildren();
		const firstChild = children[0].children![0].children![0];
		assert.strictEqual(firstChild.value, '0x41424344');
		assert.ok(firstChild.description?.includes('[0x08]'));
	});

	test('refresh calls readMemory with correct parameters', async () => {
		(provider as any).debuggingActivate = true;
		const mockResponse = { data: 'test', address: 0x8 };
		const readMemoryStub = sandbox.stub(debuggerService, 'readMemory').resolves(mockResponse);

		await provider.refresh();

		const firstCall = readMemoryStub.firstCall;
		assert.strictEqual(firstCall.args[0], 0x8);
		assert.strictEqual(firstCall.args[1], 0);
		assert.strictEqual(firstCall.args[2], 4);
	});
});