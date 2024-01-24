import { BN, BigNum, PRICE_PRECISION_EXP } from '@drift-labs/sdk';
import axios from 'axios';

export const MAX_TXNS_PER_REQUEST = 1000;
export const MAX_TXNS_BUFFER = 100;
export const PTYH_HISTORICAL_API_RATE_LIMIT = 30; // 30 requests per 10 seconds

export const MARKET_INDEX_TO_PRICE_FEED_ID: { [marketIndex: number]: string } =
	{
		6: '0x67be9f519b95cf24338801051f9a808eff0a578ccb388db73b7f6fe1de019ffb',
	};

export const consoleLog = (...messages: (string | number)[]) => {
	console.log('\x1b[33m%s\x1b[0m', '[-]', ...messages);
};

export const getHistoricalPriceFromPyth = async (
	timestamp: number,
	marketIndex: number
): Promise<BigNum> => {
	if (marketIndex === 0) return BigNum.fromPrint('1', PRICE_PRECISION_EXP); // if market is USDC, return $1

	const priceFeedId = MARKET_INDEX_TO_PRICE_FEED_ID[marketIndex];

	if (!priceFeedId)
		throw new Error('Price feed ID not found for market index ' + marketIndex);

	const res = await axios.get(
		`https://benchmarks.pyth.network/v1/updates/price/${timestamp}?${new URLSearchParams(
			{
				ids: priceFeedId,
			}
		)}`
	);

	const exponent = Math.abs(res.data.parsed[0].price.expo) as number;

	return BigNum.from(
		new BN(res.data.parsed[0].price.price as string),
		new BN(exponent)
	);
};
