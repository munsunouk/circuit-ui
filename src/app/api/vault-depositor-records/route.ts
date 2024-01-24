import { and, count, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '../../../../database/connect';
import { vault_depositor_records } from '../../../../database/schema';
import { checkQueryIsNumber } from '../_utils';

export const GET = async (request: NextRequest) => {
	const searchParams = request.nextUrl.searchParams;

	const vault = searchParams.get('vault');
	const depositor = searchParams.get('depositor');
	const limit = checkQueryIsNumber(searchParams.get('limit'), 100);
	const page = checkQueryIsNumber(searchParams.get('page'), 0);

	if (!vault || !depositor) {
		return Response.json({
			error: 'vault and depositor are required in the query params',
		});
	}

	const recordsPromise = db
		.select()
		.from(vault_depositor_records)
		.where(
			and(
				eq(vault_depositor_records.vault, vault),
				eq(vault_depositor_records.depositorAuthority, depositor)
			)
		)
		.limit(limit)
		.offset(page * limit);

	const recordsCountPromise = db
		.select({ value: count() })
		.from(vault_depositor_records)
		.where(
			and(
				eq(vault_depositor_records.vault, vault),
				eq(vault_depositor_records.depositorAuthority, depositor)
			)
		);

	const [records, recordsCount] = await Promise.all([
		recordsPromise,
		recordsCountPromise,
	]);

	return Response.json({ records, count: recordsCount?.[0].value ?? 0 });
};
