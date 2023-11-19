import useAppStore from '../stores/app/useAppStore';
import useIsTermsAcknowledgementValid from './useIsTermsAcknowledgementValid';

export default function useOpenConnectWalletModal() {
	const setStore = useAppStore((s) => s.set);
	const isAcknowledgementValid = useIsTermsAcknowledgementValid();

	const openConnectWalletModal = () => {
		if (isAcknowledgementValid) {
			setStore((s) => {
				s.modals.showConnectWalletModal = true;
			});
		} else {
			setStore((s) => {
				s.modals.showAcknowledgeTermsModal = true;
			});
		}
	};

	return openConnectWalletModal;
}
