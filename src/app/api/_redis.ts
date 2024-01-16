import dayjs from 'dayjs';

dayjs.extend(require('dayjs/plugin/utc'));

export class RedisKeyManager {
	/**
	 *  Key representing the apy, returns, and timestamp (by the minute)
	 */
	static getApyReturnsKey() {
		return `apy-returns`;
	}
}
