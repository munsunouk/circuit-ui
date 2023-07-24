'use client';

import React from 'react';

import useAppStore from '@/hooks/useAppStore';

import ConnectWalletModal from './ConnectWalletModal';
import RpcSwitcherModal from './RpcSwitcherModal';

function FloatingUi() {
	const { showConnectWalletModal, showRpcSwitcherModal } = useAppStore(
		(s) => s.modals
	);

	return (
		<>
			{showConnectWalletModal ? (
				<ConnectWalletModal />
			) : showRpcSwitcherModal ? (
				<RpcSwitcherModal />
			) : (
				<></>
			)}
		</>
	);
}

export default React.memo(FloatingUi);
