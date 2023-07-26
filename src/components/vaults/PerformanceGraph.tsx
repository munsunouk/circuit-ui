import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import dayjs from 'dayjs';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	TooltipProps,
	XAxis,
	YAxis,
} from 'recharts';
import { twMerge } from 'tailwind-merge';

const CustomTooltip = ({
	active,
	payload,
	label,
}: TooltipProps<number, string>) => {
	if (active && payload && payload.length) {
		const date = dayjs.unix(label).format('D MMM YYYY');
		const pnl = payload[0].value ?? 0;

		const isProfit = pnl > 0;

		return (
			<div className="bg-black border border-[#32D7D720] p-2">
				<p>{date}</p>
				<p
					className={twMerge(
						isProfit ? 'text-success-green-border' : 'text-error-red-border'
					)}
				>
					{isProfit && '+'}
					{BigNum.from(pnl, QUOTE_PRECISION_EXP).toNotional()}
				</p>
			</div>
		);
	}

	return null;
};

export default function PerformanceGraph({
	data,
	bufferXPct = 0.0001,
	bufferYPct = 0.001,
}: {
	data: {
		x: any;
		y: any;
	}[];
	bufferXPct?: number;
	bufferYPct?: number;
}) {
	const minY = data.reduce((acc, curr) => Math.min(acc, curr.y), Infinity);
	const maxY = data.reduce((acc, curr) => Math.max(acc, curr.y), -Infinity);
	const yDomain = [minY * (1 - bufferYPct), maxY * (1 + bufferYPct)];

	const minX = data.reduce((acc, curr) => Math.min(acc, curr.x), Infinity);
	const maxX = data.reduce((acc, curr) => Math.max(acc, curr.x), -Infinity);
	const xDomain = [minX * (1 - bufferXPct), maxX * (1 + bufferXPct)];

	return (
		<ResponsiveContainer width={'100%'} height={320}>
			<LineChart data={data}>
				<Line
					type="monotone"
					dataKey="y"
					stroke="var(--main-blue)"
					strokeWidth={2}
					dot={false}
				/>
				<CartesianGrid stroke="#32D7D720" />
				<XAxis
					tickCount={40}
					type="number"
					dataKey={'x'}
					domain={xDomain}
					hide
					interval={2}
				/>
				<YAxis domain={yDomain} hide />
				{/* @ts-ignore */}
				<Tooltip content={(props) => <CustomTooltip {...props} />} />
			</LineChart>
		</ResponsiveContainer>
	);
}
