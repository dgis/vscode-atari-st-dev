import * as assert from 'assert';
import { getNonce, asciiToHexa, makeDeferred } from '../util';

suite('Util Tests', () => {
	test('getNonce generates 32 character string', () => {
		const nonce = getNonce();
		assert.strictEqual(nonce.length, 32);
	});

	test('getNonce generates different values', () => {
		const nonce1 = getNonce();
		const nonce2 = getNonce();
		assert.notStrictEqual(nonce1, nonce2);
	});

	test('getNonce contains only valid characters', () => {
		const nonce = getNonce();
		const validChars = /^[A-Za-z0-9]+$/;
		assert.ok(validChars.test(nonce));
	});

	test('asciiToHexa converts simple string', () => {
		const result = asciiToHexa('ABC');
		assert.strictEqual(result, '414243');
	});

	test('asciiToHexa converts empty string', () => {
		const result = asciiToHexa('');
		assert.strictEqual(result, '');
	});

	test('asciiToHexa converts special characters', () => {
		const result = asciiToHexa('!@#');
		assert.strictEqual(result, '214023');
	});

	test('makeDeferred creates promise with resolve', async () => {
		const deferred = makeDeferred<string>();
		const testValue = 'test';
		
		deferred.resolve!(testValue);
		const result = await deferred.promise;
		
		assert.strictEqual(result, testValue);
	});

	test('makeDeferred creates promise with reject', async () => {
		const deferred = makeDeferred<string>();
		const testError = 'error';
		
		deferred.reject!(testError);
		
		try {
			await deferred.promise;
			assert.fail('Promise should have rejected');
		} catch (error) {
			assert.strictEqual(error, testError);
		}
	});
});