import { PerformanceGraphData } from "@/types";
import { SUPERCHARGER_PAST_DATA } from "./supercharger";

export const TEST_VAULT_PUBKEY = 'BxDh8x17Bf3pDf17uh65kXCwmdMpdNjTj91hVqkmFpAp';

export interface UiVaultConfig {
	name: string;
	pubkeyString?: string;
	description: string;
	comingSoon?: boolean;
	permissioned?: boolean;
	previewBackdropUrl: string;
	backdropParticlesColor: string;
	pastPerformanceHistory?: PerformanceGraphData[];
}

export const SUPERCHARGER_VAULT: UiVaultConfig = {
	name: 'Supercharger',
	pubkeyString: TEST_VAULT_PUBKEY,
	description:
		'Multiply your yields with delta-neutral market making strategies',
	permissioned: true,
	previewBackdropUrl: '/backdrops/supercharger-backdrop.svg',
	backdropParticlesColor: '#88c9ff',
	pastPerformanceHistory: SUPERCHARGER_PAST_DATA
};

export const VAULTS: UiVaultConfig[] = [
	SUPERCHARGER_VAULT,
	{
		name: 'Turbocharger',
		// pubkey: new PublicKey('2bXtK9phuqUbqsmonWCNYcV87DkFmqyRiDqGen4daZwx'),
		description: 'Delta-neutral market making strategy',
		comingSoon: true,
		previewBackdropUrl: '/backdrops/turbocharger-backdrop.svg',
		backdropParticlesColor: '#3DBC9D',
	},
	{
		name: 'Delta Neutral DLP',
		// pubkey: new PublicKey('B4LBd4DEKZZLvkn7eazUf7xU9RuTpvxH4th18VgVzMpB'),
		description: 'Hedged Drift Liquidity Provider (DLP) strategy',
		comingSoon: true,
		previewBackdropUrl: '/backdrops/hedged-dlp-backdrop.svg',
		backdropParticlesColor: '#88c9ff',
	},
];
