import { produce } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type HistoricalPrice = {
	timestamp: number;
	price: number;
};

export interface AssetPriceHistoryStore {
	set: (x: (s: AssetPriceHistoryStore) => void) => void;
	get: (x: any) => AssetPriceHistoryStore;
	assets: Record<number, HistoricalPrice[]>; // prices are sorted by timestamp in ascending order	(by CoinGecko)
}

export const useAssetPriceHistoryStore = create(
	devtools<AssetPriceHistoryStore>((set, get) => ({
		set: (fn) => set(produce(fn)),
		get: () => get(),
		assets: {},
	}))
);
