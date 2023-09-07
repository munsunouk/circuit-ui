import {
	useCommonDriftActions,
	useLastAcknowledgedTerms,
} from '@drift-labs/react';
import { useWallet } from '@solana/wallet-adapter-react';

import useAppStore from '@/hooks/useAppStore';

import { CIRCUIT_TERMS_AND_CONDITIONS_URL } from '@/constants/misc';

import Button from '../elements/Button';
import { Modal } from './Modal';

export default function AcknowledgeTermsModal() {
	const setAppStore = useAppStore((s) => s.set);
	const commonActions = useCommonDriftActions();
	const { updateLastAcknowledgedTerms } = useLastAcknowledgedTerms();
	const { disconnect, connected } = useWallet();

	const handleClose = () => {
		setAppStore((s) => {
			s.modals.showAcknowledgeTermsModal = false;
		});
		disconnect();
		commonActions.handleWalletDisconnect();
	};

	const handleAgree = () => {
		updateLastAcknowledgedTerms();
		setAppStore((s) => {
			s.modals.showAcknowledgeTermsModal = false;

			if (!connected) {
				s.modals.showConnectWalletModal = true;
			}
		});
	};

	return (
		<Modal
			onClose={handleClose}
			header="Acknowledge Terms"
			className="max-w-[600px]"
		>
			<div>
				Vaults is experimental. Your use of this interface is at your sole risk.
				Please make sure you understand any platforms or protocols underlying
				these Vaults. By continuing, you agree and acknowledge you understand{' '}
				<a
					href={CIRCUIT_TERMS_AND_CONDITIONS_URL}
					className="underline text-main-blue"
					target="_blank"
					rel="noopener noreferrer"
				>
					Circuit&apos;s Terms
				</a>
				, together with any further terms set out on the interface or on the
				specific vault interface. You agree that Circuit will not be liable for
				any losses, claims, damages, errors, bugs, disruptions, and/or delays.
			</div>

			<Button onClick={handleAgree} className="py-2 mt-4">
				Agree and Continue
			</Button>
		</Modal>
	);
}
