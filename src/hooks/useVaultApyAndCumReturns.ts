import useSWR from 'swr';

const useVaultApyAndCumReturns = (vaultPubKeyString: string | undefined) => {
	const { data, error, isLoading } = useSWR<{
		data: {
			vaults: Record<
				string,
				{
					apy: number;
					returns: number;
				}
			>;
			ts: number;
		};
	}>(vaultPubKeyString ? '/api/apy-returns' : null, {
		refreshInterval: 1000 * 60,
	});

	if (error || !data || !vaultPubKeyString) {
		error && console.error(error);
		return {
			apy: 0,
			cumReturns: 0,
			isLoading: true,
		};
	}

	return {
		apy: (data.data.vaults[vaultPubKeyString]?.apy ?? 0) * 100,
		cumReturns: (data.data.vaults[vaultPubKeyString]?.returns ?? 0) * 100,
		isLoading,
	};
};

export default useVaultApyAndCumReturns;
