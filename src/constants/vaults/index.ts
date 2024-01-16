import { UiVaultConfig } from '@/types';

import { WETH_DEPOSIT_ASSET } from '../assets';
import { JITOSOL_BASIS_VAULT } from './jitosol-basis';
import { SUPERCHARGER_VAULT } from './supercharger';
import { TURBOCHARGER_VAULT } from './turbocharger';

const WETH_BASIS_VAULT: UiVaultConfig = {
	name: 'wETH Basis Vault',
	pubkeyString: 'DAFeTZdBRmpawFXV61NuVF93ad79d67YEGQGFuWR2LfS',
	description: 'Basis trading strategy for wETH',
	previewBackdropUrl: '/backdrops/hedged-dlp-backdrop.svg',
	backdropParticlesColor: '#88c9ff',
	market: WETH_DEPOSIT_ASSET.market,
	assetColor: WETH_DEPOSIT_ASSET.borderColor,
	userPubKey: 'Fi1NzNpH9gA1hW8idZmNTzuEQUnNE6VJJh6rdgSeVgTn',
};

export const VAULTS: UiVaultConfig[] = [
	SUPERCHARGER_VAULT,
	TURBOCHARGER_VAULT,
	JITOSOL_BASIS_VAULT,
	// WETH_BASIS_VAULT,
];

export const DEPOSIT_ASSET_MARKETS = VAULTS.map((v) => v.market);
