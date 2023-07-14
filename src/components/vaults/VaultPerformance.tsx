import SectionHeader from '../SectionHeader';
import BreakdownRow from './BreakdownRow';

export default function VaultPerformance() {
	return (
		<div className="flex flex-col w-full gap-8">
			<div className="flex flex-col w-full gap-4">
				<SectionHeader>Performance Breakdown</SectionHeader>
				<div className="flex flex-col w-full gap-2">
					<BreakdownRow label="Total Earnings (All Time)" value="$0.00" />
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
