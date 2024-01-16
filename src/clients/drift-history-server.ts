import { SerializedDepositHistory } from '@/types';
import { PublicKey } from '@drift-labs/sdk';
import { Serializer, UISerializableDepositRecord } from '@drift/common';
import axios from 'axios';

import Env from '@/constants/environment';

type ServerResponse<T> = {
	success: boolean;
	data?: T;
	message?: string;
	status?: number;
};

type DepositHistoryResult = {
	records: (UISerializableDepositRecord | SerializedDepositHistory)[][];
	totalCounts: number[];
};

export class DriftHistoryServerClient {
	static DRIFT_HISTORY_SERVER = axios.create({
		baseURL: Env.historyServerUrl,
	});

	static async get<T extends any>(apiEndpoint: string) {
		const res =
			await this.DRIFT_HISTORY_SERVER.get<ServerResponse<T>>(apiEndpoint);

		return res.data;
	}

	public static async fetchUserAccountsDepositHistory(
		deserialize: boolean,
		...userAccounts: PublicKey[]
	): Promise<ServerResponse<DepositHistoryResult>> {
		const PAGE_SIZE = 100;
		const userAccountsString = userAccounts
			.map((acc) => acc.toString())
			.join(',');

		const firstPageResults = await this.get<DepositHistoryResult>(
			`/deposits/userAccounts/?userPublicKeys=${userAccountsString}&pageIndex=0&pageSize=${PAGE_SIZE}`
		);

		if (!firstPageResults.success || !firstPageResults.data)
			return firstPageResults;

		// check if there are more pages left to fetch and fetch them
		const maxTotalCount = Math.max(...firstPageResults.data.totalCounts);
		const maxPageCount = Math.ceil(maxTotalCount / PAGE_SIZE);
		const pagesLeftToFetch = maxPageCount - 1;

		const promises = Array.from({ length: pagesLeftToFetch }).map((_, i) =>
			this.get<DepositHistoryResult>(
				`/deposits/userAccounts/?userPublicKeys=${userAccountsString}&pageIndex=${
					i + 1
				}&pageSize=${PAGE_SIZE}`
			)
		);

		const nonFirstPageResults = await Promise.all(promises);
		const finalCombinedResults = nonFirstPageResults.reduce((acc, cur) => {
			return {
				...acc,
				data: {
					totalCounts: cur.data?.totalCounts ?? [],
					records:
						acc.data?.records.map((records, i) => [
							...records,
							...(cur.data?.records[i] ?? []),
						]) ?? [],
				},
			};
		}, firstPageResults);

		const history = deserialize
			? (finalCombinedResults.data?.records.map((records: any) =>
					records.map((record: any) => Serializer.Deserialize.UIDeposit(record))
				) as UISerializableDepositRecord[][])
			: (finalCombinedResults.data?.records as SerializedDepositHistory[][]);

		return {
			...finalCombinedResults,
			data: {
				totalCounts: finalCombinedResults.data?.totalCounts ?? [],
				records: history,
			},
		};
	}
}
