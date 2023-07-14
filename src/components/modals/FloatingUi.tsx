'use client';

import React from 'react';

import useAppStore from '@/hooks/useAppStore';

import ConnectWalletModal from './ConnectWalletModal';

function FloatingUi() {
	const { showConnectWalletModal } = useAppStore((s) => s.modals);

	return <>{showConnectWalletModal ? <ConnectWalletModal /> : <></>}</>;
}

export default React.memo(FloatingUi);
