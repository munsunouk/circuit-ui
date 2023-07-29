import { BN, BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import {
	HistoryResolution,
	UISerializableAccountSnapshot,
} from '@drift/common';

import useCurrentVault from '@/hooks/useCurrentVault';
import useCurrentVaultAccount from '@/hooks/useCurrentVaultAccount';
import useCurrentVaultStats from '@/hooks/useCurrentVaultStats';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import { ExternalLink } from '../icons';
import BreakdownRow from './BreakdownRow';
import PerformanceGraph from './PerformanceGraph';

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccount = useCurrentVaultAccount();
	const vaultStats = useCurrentVaultStats();

	const totalDeposits = vaultAccount?.netDeposits ?? new BN(0);
	const currentBalance = vaultStats.netUsdValue;
	const totalEarnings = currentBalance.sub(totalDeposits); // FIXME: this is not correct, should be a cumulative sum of period earnings, where period = until withdrawal time

	const formatPnlHistory = (pnlHistory: UISerializableAccountSnapshot[]) => {
		const formattedHistory = pnlHistory.map((snapshot) => ({
			x: snapshot.epochTs,
			// @ts-ignore
			y: snapshot.allTimeTotalPnl as number,
		}));

		// find the last index of the leading numbers where the numbers are intangible
		// we define intangible as a number that is less than 1% of the next number
		let intangibleIndex = -1;
		for (let i = 0; i < formattedHistory.length; i++) {
			if (i === formattedHistory.length - 1) {
				continue;
			}

			const isIntangible =
				formattedHistory[i].y === 0 ||
				formattedHistory[i].y < Math.abs(formattedHistory[i + 1].y) * 0.01;

			if (!isIntangible && intangibleIndex > -1) {
				break;
			} else {
				intangibleIndex = i;
			}
		}

		return formattedHistory.slice(intangibleIndex + 1);
	};

	return (
		<div className="flex flex-col w-full gap-8">
			<div className="flex flex-col w-full gap-4">
				<SectionHeader>Performance Breakdown</SectionHeader>
				<div className="flex flex-col w-full gap-1 md:gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={BigNum.from(totalEarnings, QUOTE_PRECISION_EXP).toNotional()}
					/>
					<BreakdownRow label="Cumulative Return" value="$0.00" />
					<BreakdownRow label="Max Daily Drawdown" value="$0.00" />
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<SectionHeader>Cumulative Performance</SectionHeader>
				<PerformanceGraph
					data={formatPnlHistory(
						vault?.pnlHistory[HistoryResolution.ALL] ?? []
					)}
				/>
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
					href={`https://app.drift.trade/?authority=${vaultAccount?.pubkey.toString()}`}
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
