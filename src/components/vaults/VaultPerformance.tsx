import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import {
	HistoryResolution,
	UISerializableAccountSnapshot,
} from '@drift/common';
import dayjs from 'dayjs';

import useCurrentVault from '@/hooks/useCurrentVault';
import useCurrentVaultAccount from '@/hooks/useCurrentVaultAccount';
import useCurrentVaultStats from '@/hooks/useCurrentVaultStats';

import SectionHeader from '../SectionHeader';
import Button from '../elements/Button';
import FadeInDiv from '../elements/FadeInDiv';
import { ExternalLink } from '../icons';
import BreakdownRow from './BreakdownRow';
import PerformanceGraph from './PerformanceGraph';

export default function VaultPerformance() {
	const vault = useCurrentVault();
	const vaultAccount = useCurrentVaultAccount();
	const vaultStats = useCurrentVaultStats();

	const totalEarnings = vaultStats.totalAllTimePnl;

	const normalizeDate = (epochTs: number) => {
		return dayjs(dayjs.unix(epochTs).format('MM/DD/YYYY')).unix();
	};

	const formatPnlHistory = (pnlHistory: UISerializableAccountSnapshot[]) => {
		const formattedHistory = pnlHistory
			.map((snapshot) => ({
				x: snapshot.epochTs,
				// @ts-ignore - snapshot response was not deserialized, hence its default form is already a number
				y: snapshot.allTimeTotalPnl as number,
			}))
			.concat({
				x: Date.now() / 1000,
				y: vaultStats.totalAllTimePnl,
			})
			.map((point) => ({
				...point,
				x: normalizeDate(point.x), // normalize to start of day so that the graph looks consistent
			}));

		return formattedHistory;
	};

	return (
		<div className="flex flex-col w-full gap-8">
			<FadeInDiv className="flex flex-col w-full gap-4">
				<SectionHeader>Performance Breakdown</SectionHeader>
				<div className="flex flex-col w-full gap-1 md:gap-2">
					<BreakdownRow
						label="Total Earnings (All Time)"
						value={BigNum.from(totalEarnings, QUOTE_PRECISION_EXP).toNotional()}
					/>
					<BreakdownRow label="Cumulative Return" value="$0.00" />
					<BreakdownRow label="Max Daily Drawdown" value="$0.00" />
				</div>
			</FadeInDiv>

			<FadeInDiv className="flex flex-col gap-4" delay={100}>
				<SectionHeader>Cumulative Performance</SectionHeader>
				<PerformanceGraph
					data={formatPnlHistory(
						vault?.pnlHistory[HistoryResolution.ALL] ?? []
					)}
				/>
			</FadeInDiv>

			<FadeInDiv delay={200}>
				<SectionHeader className="mb-4">Vault Activity</SectionHeader>
				<div>
					View this Vault’s activity from open positions, recent trades, to open
					orders any time. In the Overview page, you can download the activity
					history for your records.
				</div>
			</FadeInDiv>
			<FadeInDiv delay={200}>
				<a
					href={`https://app.drift.trade/?authority=${vaultAccount?.pubkey.toString()}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button secondary Icon={ExternalLink}>
						View Vault Activity on Drift
					</Button>
				</a>
			</FadeInDiv>
		</div>
	);
}
