import { PublicKey } from '@drift-labs/sdk';
import { COMMON_UI_UTILS, OpenPosition } from '@drift/common';
import { useEffect, useState } from 'react';

import { PERP_MARKETS_LOOKUP } from '@/constants/environment';

import useAppStore from '../useAppStore';

export const useVaultOpenPerpPositions = (
	vaultAddress: PublicKey | undefined
) => {
	const vaultDriftUserAccount = useAppStore((s) =>
		s.getVaultDriftUserAccount(vaultAddress)
	);
	const vaultDriftClient = useAppStore((s) =>
		s.getVaultDriftClient(vaultAddress)
	);
	const vaultDriftUser = useAppStore((s) => s.getVaultDriftUser(vaultAddress));
	const driftClientIsReady = !!vaultDriftClient?.isSubscribed;

	const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);

	useEffect(() => {
		if (
			!driftClientIsReady ||
			!vaultDriftClient ||
			!vaultDriftUserAccount ||
			!vaultDriftUser
		)
			return;

		const userAccountPositions = vaultDriftUserAccount?.perpPositions;
		const openPositions = COMMON_UI_UTILS.getOpenPositionData(
			vaultDriftClient,
			userAccountPositions,
			vaultDriftUser,
			PERP_MARKETS_LOOKUP
		);

		setOpenPositions(openPositions);
	}, [
		vaultDriftUserAccount,
		vaultDriftClient,
		vaultDriftUser,
		driftClientIsReady,
	]);

	return openPositions;
};
