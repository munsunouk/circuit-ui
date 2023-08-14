'use client';

import React from 'react';

import useAppStore from '@/hooks/useAppStore';

import ConnectWalletModal from './ConnectWalletModal';
import RpcSwitcherModal from './RpcSwitcherModal';
import StoreModal from './StoreModal';

function FloatingUi() {
	const { showConnectWalletModal, showRpcSwitcherModal, showStoreModal } =
		useAppStore((s) => s.modals);

	return (
		<>
			{showConnectWalletModal ? (
				<ConnectWalletModal />
			) : showRpcSwitcherModal ? (
				<RpcSwitcherModal />
			) : showStoreModal ? (
				<StoreModal />
			) : (
				<></>
			)}
		</>
	);
}

export default React.memo(FloatingUi);
