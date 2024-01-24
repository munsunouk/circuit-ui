import { NextRequest } from 'next/server';

import { backfillSupportedVaultsDeposits } from '../../../../../scripts/tasks/backfill-vault-deposits';

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	backfillSupportedVaultsDeposits();

	return new Response('ok', {
		status: 200,
	});
}
