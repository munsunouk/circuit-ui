import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';

import useCurrentVault from '@/hooks/useCurrentVault';

import SectionHeader from '../SectionHeader';
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
		</div>
	);
}
