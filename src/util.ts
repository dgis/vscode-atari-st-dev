export function getNonce() {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function asciiToHexa(ascii: string): string {
	return [...ascii].map(char => char.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

export function makeDeferred<T>() {
	const deferred: {
		promise: Promise<T> | null,
		resolve: ((value?: T) => void) | null,
		reject: ((reason?: T) => void) | null
	} = {
		promise: null,
		resolve: null,
		reject: null
	};
	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve as ((value?: T) => void) | null;
		deferred.reject = reject;
	});
	return deferred;
}
