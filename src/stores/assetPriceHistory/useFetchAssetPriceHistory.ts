import axios from 'axios';
import { useEffect, useState } from 'react';
import invariant from 'tiny-invariant';

import { ASSETS } from '@/constants/assets';
import { COINGECKO_API_URL } from '@/constants/misc';

import { useAssetPriceHistoryStore } from './useAssetPriceHistoryStore';

type CoinGeckoMarketRangeResult = {
	prices: [number, number][];
};

const getCoingeckoMarketRangeApi = (
	coingeckoId: string,
	fromTs: number,
	toTs: number,
	currency = 'usd'
) => {
	return `${COINGECKO_API_URL}/coins/${coingeckoId}/market_chart/range?vs_currency=${currency}&from=${fromTs}&to=${toTs}`;
};

const ONE_YEAR_AGO_TIMESTAMP = Math.floor(
	Date.now() / 1000 - 365 * 24 * 60 * 60
);

/**
 * Fetch asset price history from CoinGecko API.
 * Only fetch price history if there is no price history or the price history is older than 1 year.
 */
const useFetchAssetPriceHistory = (
	assetMarketIndex: number,
	earliestTs = ONE_YEAR_AGO_TIMESTAMP
) => {
	const setAssetPriceHistoryStore = useAssetPriceHistoryStore((s) => s.set);
	const currentAssetPriceHistory = useAssetPriceHistoryStore(
		(s) => s.assets[assetMarketIndex] ?? []
	);

	const coingeckoId = ASSETS.find(
		(asset) => asset.market.marketIndex === assetMarketIndex
	)?.coingeckoId;

	invariant(
		coingeckoId,
		`coingeckoId not find for asset market index ${assetMarketIndex}`
	);

	useEffect(() => {
		// fetch prices only if there is no price history or the price history is older than 1 year
		if (
			currentAssetPriceHistory?.length > 0 &&
			earliestTs >= ONE_YEAR_AGO_TIMESTAMP
		)
			return;

		const toTs = Math.floor(Date.now() / 1000);
		const apiUrl = getCoingeckoMarketRangeApi(coingeckoId, earliestTs, toTs);

		axios.get<CoinGeckoMarketRangeResult>(apiUrl).then((response) => {
			const data = response.data;
			const prices = data.prices;
			const assetPriceHistory = prices.map((price) => ({
				timestamp: price[0],
				price: price[1],
			}));

			setAssetPriceHistoryStore((state) => {
				state.assets[assetMarketIndex] = assetPriceHistory;
			});
		});
	}, [earliestTs, assetMarketIndex, currentAssetPriceHistory.length]);
};

export const useGetAssetPriceHistory = (
	assetMarketIndex: number,
	earliestTs: number
) => {
	const [loading, setLoading] = useState(true);

	const assetPriceHistory = useAssetPriceHistoryStore(
		(s) => s.assets[assetMarketIndex] ?? []
	);

	const earliestFetchedTs =
		assetPriceHistory[0]?.timestamp ?? Date.now() / 1000;

	useFetchAssetPriceHistory(assetMarketIndex, earliestTs);

	useEffect(() => {
		if (earliestFetchedTs >= earliestTs) {
			setLoading(false);
		} else {
			setLoading(true);
		}
	}, [earliestFetchedTs]);

	return {
		loading,
		assetPriceHistory,
	};
};
