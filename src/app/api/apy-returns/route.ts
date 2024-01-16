import { kv } from '@vercel/kv';

import { RedisKeyManager } from '../_redis';

export const revalidate = 60;

export const GET = async () => {
	const apyReturnsKey = RedisKeyManager.getApyReturnsKey();
	const cachedApyReturns = await kv.hgetall(apyReturnsKey);

	if (!cachedApyReturns) {
		return Response.json({ error: 'No cached apy returns found' });
	}

	return Response.json({ data: cachedApyReturns });
};
