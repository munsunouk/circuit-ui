'use client';

import useAppStore from '@/stores/app/useAppStore';
import React from 'react';

import AcknowledgeTermsModal from './AcknowledgeTermsModal';
import ActionRecordModal from './ActionRecordModal';
import ConnectWalletModal from './ConnectWalletModal';
import RpcSwitcherModal from './RpcSwitcherModal';
import StoreModal from './StoreModal';

function FloatingUi() {
	const {
		showConnectWalletModal,
		showRpcSwitcherModal,
		showStoreModal,
		showActionRecordModal,
		showAcknowledgeTermsModal,
	} = useAppStore((s) => s.modals);

	return (
		<>
			{showConnectWalletModal ? (
				<ConnectWalletModal />
			) : showRpcSwitcherModal ? (
				<RpcSwitcherModal />
			) : showStoreModal ? (
				<StoreModal />
			) : showActionRecordModal.show ? (
				<ActionRecordModal actionRecord={showActionRecordModal.actionRecord} />
			) : showAcknowledgeTermsModal ? (
				<AcknowledgeTermsModal />
			) : (
				<></>
			)}
		</>
	);
}

export default React.memo(FloatingUi);
