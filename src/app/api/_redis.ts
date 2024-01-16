import dayjs from 'dayjs';

dayjs.extend(require('dayjs/plugin/utc'));

export class RedisKeyManager {
	/**
	 *  Key representing the apy, returns, and timestamp (by the minute)
	 */
	static getApyReturnsKey(timestamp: number) {
		return `apy-returns:${dayjs(timestamp).utc().format('DD-MM-YYYY-HH-mm')}`;
	}
}
