import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

import useAppStore from './useAppStore';
import useIsTermsAcknowledgementValid from './useIsTermsAcknowledgementValid';

export default function useShowAcknowledgeModal() {
	const setAppStore = useAppStore((s) => s.set);
	const { connected } = useWallet();

	const isAcknowledgementValid = useIsTermsAcknowledgementValid();

	useEffect(() => {
		if (!isAcknowledgementValid && connected) {
			setAppStore((s) => {
				s.modals.showAcknowledgeTermsModal = true;
			});
		}
	}, [isAcknowledgementValid, connected]);
}
