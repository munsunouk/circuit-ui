import dayjs from 'dayjs';

export class RedisKeyManager {
	/**
	 *  Key representing the apy, returns, and timestamp (by the minute)
	 */
	static getApyReturnsKey(timestamp: number) {
		return `apy-returns:${dayjs(timestamp).utc().format('DD-MM-YYYY-HH-mm')}`;
	}
}
