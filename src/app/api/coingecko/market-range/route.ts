import axios from 'axios';
import { NextRequest } from 'next/server';

import { COINGECKO_API_URL } from '@/constants/misc';

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const coinId = searchParams.get('coinId');
	const currency = searchParams.get('currency');
	const fromTs = searchParams.get('fromTs');
	const toTs = searchParams.get('toTs');

	if (!coinId || !currency || !fromTs || !toTs) {
		return Response.json({
			error: 'coinId, currency, fromTs, toTs are required in the query params',
		});
	}

	const response = await axios.get(
		`${COINGECKO_API_URL}/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${fromTs}&to=${toTs}&x_cg_pro_api_key=${process.env.COINGECKO_PRO_API_KEY}`
	);

	return Response.json(response.data);
}
