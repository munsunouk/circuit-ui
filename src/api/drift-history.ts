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

export class DriftHistoryServerClient {
	static DRIFT_HISTORY_SERVER = axios.create({
		baseURL: Env.historyServerUrl,
	});

	static async get(apiEndpoint: string) {
		const res =
			await this.DRIFT_HISTORY_SERVER.get<ServerResponse<any>>(apiEndpoint);

		return res.data;
	}

	public static async fetchUserAccountsDepositHistory(
		...userAccounts: PublicKey[]
	): Promise<
		ServerResponse<{
			records: UISerializableDepositRecord[][];
			totalCounts: number[];
			maxRecordLimit: number;
		}>
	> {
		const result = await this.get(
			`/deposits/userAccounts/?userPublicKeys=${userAccounts
				.map((acc) => acc.toString())
				.join(',')}&pageIndex=0&pageSize=1000`
		);

		const deserializedDeposits = result.data.records.map((records: any) =>
			records.map((record: any) => Serializer.Deserialize.UIDeposit(record))
		);

		return {
			...result,
			data: {
				...result.data,
				records: deserializedDeposits,
			},
		};
	}
}
