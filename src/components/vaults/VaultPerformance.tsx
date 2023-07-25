import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';

import useCurrentVault from '@/hooks/useCurrentVault';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import { ExternalLink } from '../icons';
import BreakdownRow from './BreakdownRow';

export default function VaultPerformance() {
	const vault = useCurrentVault();

	const totalDeposits = vault?.info.netDeposits ?? new BN(0);
	const currentBalance = vault?.stats.netUsdValue ?? new BN(0);
	const totalEarnings = currentBalance.sub(totalDeposits); // FIXME: this is not correct, should be a cumulative sum of period earnings, where period = until withdrawal time

	return (
		<div className="flex flex-col w-full gap-8">
			<div className="flex flex-col w-full gap-4">
				<SectionHeader>Performance Breakdown</SectionHeader>
				<div className="flex flex-col w-full gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={BigNum.from(totalEarnings, QUOTE_PRECISION_EXP).toNotional()}
					/>
					<BreakdownRow label="Cumulative Return" value="$0.00" />
					<BreakdownRow label="Max Daily Drawdown" value="$0.00" />
				</div>
			</div>

			<div>
				<SectionHeader>Cumulative Performance</SectionHeader>
			</div>

			<div>
				<SectionHeader className="mb-4">Vault Activity</SectionHeader>
				<div>
					View this Vault’s activity from open positions, recent trades, to open
					orders any time. In the Overview page, you can download the activity
					history for your records.
				</div>
			</div>
			<div>
				<a
					href={`https://app.drift.trade/?authority=${vault?.info.pubkey.toString()}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button secondary Icon={ExternalLink}>
						View Vault Activity on Drift
					</Button>
				</a>
			</div>
		</div>
	);
}
