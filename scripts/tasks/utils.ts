export const MAX_TXNS_PER_REQUEST = 1000;

export const consoleLog = (...messages: (string | number)[]) => {
	console.log('\x1b[33m%s\x1b[0m', '[-]', ...messages);
};
