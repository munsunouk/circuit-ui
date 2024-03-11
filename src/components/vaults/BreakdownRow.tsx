import Skeleton from 'react-loading-skeleton';
import { twMerge } from 'tailwind-merge';

import { sourceCodePro } from '@/constants/fonts';

import { Tooltip } from '../elements/Tooltip';
import Info from '../icons/Info';

const BreakdownRow = ({
	label,
	value,
	tooltip,
	loading,
	labelInfoTooltip,
}: {
	label: string;
	value: string;
	tooltip?: {
		id: string;
		content: React.ReactNode;
		hide?: boolean;
	};
	loading?: boolean;
	labelInfoTooltip?: {
		id: string;
		content: React.ReactNode;
		hide?: boolean;
	};
}) => {
	return (
		<div className="flex justify-between md:text-xl">
			<span className="flex items-center gap-1">
				<span>{label}</span>
				{labelInfoTooltip && !labelInfoTooltip.hide && (
					<span data-tooltip-id={labelInfoTooltip.id}>
						<Info className="[&>path]:stroke-white w-4 h-4 cursor-help" />
					</span>
				)}
			</span>
			{loading ? (
				<Skeleton className="w-10" />
			) : (
				<span
					className={twMerge(
						sourceCodePro.className,
						'text-text-emphasis text-right'
					)}
					data-tooltip-id={tooltip?.id}
				>
					{value}
				</span>
			)}
			{tooltip && !tooltip?.hide && (
				<Tooltip id={tooltip.id}>{tooltip.content}</Tooltip>
			)}
			{labelInfoTooltip && !labelInfoTooltip?.hide && (
				<Tooltip id={labelInfoTooltip.id}>{labelInfoTooltip.content}</Tooltip>
			)}
		</div>
	);
};

export default BreakdownRow;
