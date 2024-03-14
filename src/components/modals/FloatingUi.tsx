'use client';

import useAppStore from '@/stores/app/useAppStore';
import React from 'react';

import AcknowledgeTermsModal from './AcknowledgeTermsModal';
import ActionRecordModal from './ActionRecordModal';
import ConnectWalletModal from './ConnectWalletModal';
import PriorityFeesSettingModal from './PriorityFeesSettingModal';
import RpcSwitcherModal from './RpcSwitcherModal';
import StoreModal from './StoreModal';

function FloatingUi() {
	const {
		showConnectWalletModal,
		showRpcSwitcherModal,
		showStoreModal,
		showActionRecordModal,
		showAcknowledgeTermsModal,
		showPriorityFeesSettingModal,
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
			) : showPriorityFeesSettingModal ? (
				<PriorityFeesSettingModal />
			) : (
				<></>
			)}
		</>
	);
}

export default React.memo(FloatingUi);
