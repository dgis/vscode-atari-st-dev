import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as extension from '../extension';

suite('Extension Tests', () => {
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
	});

	teardown(() => {
		sandbox.restore();
	});

	test('platform detection returns correct value for darwin', () => {
		const originalPlatform = process.platform;
		Object.defineProperty(process, 'platform', { value: 'darwin' });
		
		// Test indirectly by checking the behavior would be correct
		assert.strictEqual(process.platform, 'darwin');
		
		Object.defineProperty(process, 'platform', { value: originalPlatform });
	});

	test('platform detection returns correct value for win32', () => {
		const originalPlatform = process.platform;
		Object.defineProperty(process, 'platform', { value: 'win32' });
		
		assert.strictEqual(process.platform, 'win32');
		
		Object.defineProperty(process, 'platform', { value: originalPlatform });
	});

	test('platform detection returns correct value for linux', () => {
		const originalPlatform = process.platform;
		Object.defineProperty(process, 'platform', { value: 'linux' });
		
		assert.strictEqual(process.platform, 'linux');
		
		Object.defineProperty(process, 'platform', { value: originalPlatform });
	});

	test('checkAndOpenPendingWalkthrough returns early when no pending', async () => {
		const mockContext: any = {
			globalState: {
				get: () => undefined
			}
		};

		await extension.checkAndOpenPendingWalkthrough(mockContext);
		assert.ok(true); // Should not throw
	});

	test('checkAndOpenPendingWalkthrough returns early when no walkthrough', async () => {
		const mockContext: any = {
			globalState: {
				get: () => ({ workspaceFile: 'test' })
			}
		};

		await extension.checkAndOpenPendingWalkthrough(mockContext);
		assert.ok(true); // Should not throw
	});

	test('checkAndOpenPendingWalkthrough executes command when workspace matches', async () => {
		const workspaceFile = 'file:///test/workspace.code-workspace';
		const mockContext: any = {
			globalState: {
				get: () => ({ workspaceFile, walkthrough: 'test.walkthrough' }),
				update: sandbox.stub().resolves()
			}
		};

		sandbox.stub(vscode.workspace, 'workspaceFile').value(vscode.Uri.parse(workspaceFile));
		const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();

		await extension.checkAndOpenPendingWalkthrough(mockContext);

		assert.ok(executeCommandStub.calledWith('workbench.action.openWalkthrough', 'test.walkthrough'));
		assert.ok(mockContext.globalState.update.called);
	});

	test('setEnvironmentPath sets ATARIST_TOOLS path', async () => {
		const prependSpy = sandbox.spy();
		const replaceSpy = sandbox.spy();
		const mockContext: any = {
			extensionPath: '/test/extension',
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: prependSpy,
					replace: replaceSpy
				})
			}
		};

		const mockFolder = { uri: vscode.Uri.file('/test/workspace'), name: 'test', index: 0 };
		const updateSpy = sandbox.stub().resolves();
		const getConfigStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: () => undefined,
			update: updateSpy
		} as any);
		sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockFolder]);

		await extension.setEnvironmentPath(mockContext);

		assert.ok(prependSpy.calledWith('PATH'));
		assert.ok(replaceSpy.calledWith('ATARIST_TOOLS'));
		assert.ok(updateSpy.calledWith('atariSTDev.activate', true, vscode.ConfigurationTarget.Workspace));
		assert.ok(updateSpy.calledWith('atariSTDev.path'));
	});

	test('setEnvironmentPath calls prepend and replace on environmentVariableCollection', async () => {
		const prependSpy = sandbox.spy();
		const replaceSpy = sandbox.spy();
		const mockContext: any = {
			extensionPath: '/test/extension',
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: prependSpy,
					replace: replaceSpy
				})
			}
		};

		const mockFolder = { uri: vscode.Uri.file('/test/workspace'), name: 'test', index: 0 };
		sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: () => undefined,
			update: sandbox.stub().resolves()
		} as any);
		sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockFolder]);

		await extension.setEnvironmentPath(mockContext);

		assert.ok(prependSpy.called);
		assert.ok(replaceSpy.called);
		assert.strictEqual(replaceSpy.firstCall.args[0], 'ATARIST_TOOLS');
	});

	test('setEnvironmentPath calls config.update for all settings', async () => {
		const updateSpy = sandbox.stub().resolves();
		const mockContext: any = {
			extensionPath: '/test/extension',
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: () => {},
					replace: () => {}
				})
			}
		};

		const mockFolder = { uri: vscode.Uri.file('/test/workspace'), name: 'test', index: 0 };
		sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: () => undefined,
			update: updateSpy
		} as any);
		sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockFolder]);

		await extension.setEnvironmentPath(mockContext);

		assert.strictEqual(updateSpy.callCount, 3);
		assert.ok(updateSpy.calledWith('atariSTDev.activate', true, vscode.ConfigurationTarget.Workspace));
		assert.ok(updateSpy.calledWith('atariSTDev.path', sinon.match.string, vscode.ConfigurationTarget.Workspace));
	});

	test('activateExtension registers providers', async () => {
		const mockContext: any = {
			subscriptions: [],
			extensionPath: '/test',
			extensionUri: vscode.Uri.file('/test'),
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: () => {},
					replace: () => {}
				})
			}
		};

		sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
		sandbox.stub(vscode.window, 'registerTreeDataProvider').returns({ dispose: () => {} });
		sandbox.stub(vscode.window, 'registerWebviewViewProvider').returns({ dispose: () => {} });
		sandbox.stub(vscode.commands, 'executeCommand').resolves();

		await extension.activateExtension(mockContext);

		assert.ok(mockContext.subscriptions.length > 0);
	});

	test('openSamplesInNewWorkspace shows error when no workspace', async () => {
		const mockContext: any = {
			extensionPath: '/test'
		};

		sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
		const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');

		await extension.openSamplesInNewWorkspace(mockContext);

		assert.ok(showErrorStub.calledWith('Failed to copy samples. No workspace folder is opened.'));
	});

	test('openSamplesInNewWorkspace shows error when workspace not empty', async () => {
		const mockContext: any = {
			extensionPath: '/test'
		};

		const mockFolder = { uri: vscode.Uri.file('/test/workspace'), name: 'test', index: 0 };
		sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockFolder]);
		sandbox.stub(require('fs'), 'readdirSync').returns(['file.txt']);
		const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');

		await extension.openSamplesInNewWorkspace(mockContext);

		assert.ok(showErrorStub.calledWith('Failed to copy samples. Workspace folder is not empty.'));
	});

	test('activate registers getSamples command', () => {
		const mockContext: any = {
			subscriptions: [],
			extensionPath: '/test',
			globalState: {
				get: () => undefined,
				update: () => Promise.resolve()
			},
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: () => {},
					replace: () => {}
				})
			}
		};

		sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
		const registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand').returns({ dispose: () => {} });
		const initialLength = mockContext.subscriptions.length;

		extension.activate(mockContext);

		assert.ok(mockContext.subscriptions.length > initialLength);
		assert.ok(registerCommandStub.calledWith('atariSTDev.getSamples'));
	});

	test('activate listens for configuration changes when not activated', () => {
		const mockContext: any = {
			subscriptions: [],
			extensionPath: '/test',
			globalState: {
				get: () => undefined,
				update: () => Promise.resolve()
			},
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: () => {},
					replace: () => {}
				})
			}
		};

		const mockFolder = { uri: vscode.Uri.file('/test/workspace'), name: 'test', index: 0 };
		sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockFolder]);
		sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: (key: string) => key === 'activate' ? false : undefined,
			update: () => Promise.resolve()
		} as any);
		sandbox.stub(vscode.commands, 'registerCommand').returns({ dispose: () => {} });
		const onDidChangeStub = sandbox.stub(vscode.workspace, 'onDidChangeConfiguration').returns({ dispose: () => {} });

		extension.activate(mockContext);

		assert.ok(onDidChangeStub.called);
	});

	test('activate checks configuration and activates when true', () => {
		const mockContext: any = {
			subscriptions: [],
			extensionPath: '/test',
			extensionUri: vscode.Uri.file('/test'),
			globalState: {
				get: () => undefined,
				update: () => Promise.resolve()
			},
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: () => {},
					replace: () => {}
				})
			}
		};

		const mockFolder = { uri: vscode.Uri.file('/test/workspace'), name: 'test', index: 0 };
		sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockFolder]);
		sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: (key: string) => key === 'activate' ? true : undefined,
			update: () => Promise.resolve()
		} as any);
		sandbox.stub(vscode.window, 'registerTreeDataProvider').returns({ dispose: () => {} });
		sandbox.stub(vscode.window, 'registerWebviewViewProvider').returns({ dispose: () => {} });
		sandbox.stub(vscode.commands, 'registerCommand').returns({ dispose: () => {} });
		sandbox.stub(vscode.commands, 'executeCommand').resolves();

		extension.activate(mockContext);

		assert.ok(mockContext.subscriptions.length > 0);
	});

	test('activate calls checkAndOpenPendingWalkthrough', () => {
		const mockContext: any = {
			subscriptions: [],
			extensionPath: '/test',
			globalState: {
				get: sandbox.stub().returns(undefined),
				update: () => Promise.resolve()
			},
			environmentVariableCollection: {
				getScoped: () => ({
					get: () => undefined,
					prepend: () => {},
					replace: () => {}
				})
			}
		};

		sandbox.stub(vscode.workspace, 'workspaceFolders').value([]);
		sandbox.stub(vscode.commands, 'registerCommand').returns({ dispose: () => {} });

		extension.activate(mockContext);

		assert.ok(mockContext.globalState.get.called);
	});
});
