'use client';

import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import dayjs from 'dayjs';
import {
	Area,
	AreaChart,
	CartesianGrid,
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

// ticks configuration for given extremes
// e.g.
const TICKS_MAP: { [key: number]: number[] } = {
	0: [0.5, 1],
	1: [0.5, 1, 1.5],
	2: [1, 2],
	3: [1, 2, 3],
	4: [2, 4],
	5: [2.5, 5],
	6: [2.5, 5],
	7: [2.5, 5, 7.5],
	8: [5, 10],
	9: [5, 10],
};

const getTicksForGivenExtreme = (extreme: number) => {
	const sign = Math.sign(extreme);
	const absolute = Math.abs(extreme);

	const magnitude = Math.floor(Math.log10(absolute));
	const firstDigit = Math.floor(absolute / 10 ** magnitude);

	const ticks = TICKS_MAP[firstDigit].map(
		(tick) => tick * 10 ** magnitude * sign
	);
	sign < 0 && ticks.reverse();

	return ticks;
};

const getCustomYTicks = (min: number, max: number) => {
	let ticks = [0];
	let negativeAreaTicks: number[] = [];
	let positiveAreaTicks: number[] = [];

	if (min < 0) {
		negativeAreaTicks = getTicksForGivenExtreme(min);
	}

	if (max > 0) {
		positiveAreaTicks = getTicksForGivenExtreme(max);
	}

	const customTicks = [...negativeAreaTicks, ...ticks, ...positiveAreaTicks];

	return customTicks;
};

const CUSTOM_LINE_COLORS_ID = 'custom-line-colors';
const CUSTOM_AREA_COLORS_ID = 'custom-area-colors';

export default function PerformanceGraph({
	data,
	bufferXPct = 0.0001, // 0.01%
	bufferYPct = 0.2, // 0.1%
}: {
	data: {
		x: number;
		y: number;
	}[];
	bufferXPct?: number;
	bufferYPct?: number;
}) {
	const minY = data.reduce((acc, curr) => Math.min(acc, curr.y), Infinity);
	const maxY = data.reduce((acc, curr) => Math.max(acc, curr.y), -Infinity);
	const yDomain = [
		minY * (1 + minY > 0 ? -1 * bufferYPct : bufferYPct), // minY may be negative, hence we check the need to add or subtract the buffer
		maxY * (1 + bufferYPct),
	];

	const minX = data.reduce((acc, curr) => Math.min(acc, curr.x), Infinity);
	const maxX = data.reduce((acc, curr) => Math.max(acc, curr.x), -Infinity);
	const xDomain = [minX * (1 - bufferXPct), maxX * (1 + bufferXPct)];

	const getColor = (value: number) => {
		return value >= 0 ? '#66d485' : '#d46d66';
	};

	const getColorStops = () => {
		if (data?.length < 2) return [];

		let previousColor = '';
		let previousValue = 0;
		let stops: { offset: number; color: string }[] = [];

		const xAxisLength = data[data.length - 1].x - data[0].x;

		for (let i = 1; i < data.length; i++) {
			const currentColor = getColor(data[i].y);

			if (currentColor !== previousColor) {
				// find the absolute y difference between the 2 points
				// find how far back 0 is from the current point (in terms of x-axis length)
				// find the percentage of the graph between the 2 points where 0 is (in terms of x-axis length)
				const yDistanceBtwPoints =
					Math.abs(data[i].y) + Math.abs(previousValue);
				const xDistanceBtwPoints = data[i].x - data[i - 1].x;
				const zeroOffsetLengthFromSecondPoint =
					(Math.abs(data[i].y) / yDistanceBtwPoints) * xDistanceBtwPoints;
				const secondPointXLength = data[i].x - data[0].x;
				const zeroPointXLength =
					secondPointXLength - zeroOffsetLengthFromSecondPoint;

				const offsetPct = (zeroPointXLength / xAxisLength) * 100;

				stops.push({
					offset: offsetPct * 0.99,
					color: previousColor,
				});
				stops.push({
					offset: offsetPct * 1.01,
					color: currentColor,
				});
			}

			previousColor = currentColor;
			previousValue = data[i].y;
		}

		stops.push({ offset: 100, color: previousColor });
		const removedInitialUndefinedColor = stops.slice(1);

		return removedInitialUndefinedColor;
	};

	const getLineStops = () => {
		const colorStops = getColorStops();

		return colorStops.map((colorStop) => (
			<stop
				key={`${colorStop.offset}-${colorStop.color}`}
				offset={`${colorStop.offset}%`}
				stopColor={colorStop.color}
			/>
		));
	};

	/**
	 * The color of the area under the graph works as such:
	 *
	 * The highest point of the graph is 0%, the lowest point is 100%.
	 * We set the colors to change at X% of the height of the graph.
	 * Since we want the colors to change at the x-axis ($0), we find
	 * the percentage of the graph from the top of the graph to the x-axis,
	 * and set the colors to change at this offset.
	 */
	const getAreaStops = () => {
		const max = data.reduce((acc, curr) => Math.max(acc, curr.y), -Infinity);
		const min = data.reduce((acc, curr) => Math.min(acc, curr.y), Infinity);

		if (min >= 0) {
			return (
				<>
					<stop offset="0%" stopColor="#82ca9d" stopOpacity={1} />
					<stop offset="100%" stopColor="#82ca9d" stopOpacity={0.2} />
				</>
			);
		}

		if (max <= 0) {
			return (
				<>
					<stop offset="0%" stopColor="#d46d66" stopOpacity={0.2} />
					<stop offset="100%" stopColor="#d46d66" stopOpacity={1} />
				</>
			);
		}

		const zeroOffset = (max / (max - min)) * 100;

		return (
			<>
				<stop offset="0%" stopColor="#82ca9d" stopOpacity={1} />
				<stop offset={`${zeroOffset}%`} stopColor="#82ca9d" stopOpacity={0.2} />
				<stop offset={`${zeroOffset}%`} stopColor="#d46d66" stopOpacity={0.2} />
				<stop offset="100%" stopColor="#d46d66" stopOpacity={1} />
			</>
		);
	};

	return (
		<ResponsiveContainer width={'100%'} height={320}>
			<AreaChart data={data}>
				<defs>
					<linearGradient id={CUSTOM_LINE_COLORS_ID}>
						{getLineStops()}
					</linearGradient>
				</defs>
				<defs>
					<linearGradient
						id={CUSTOM_AREA_COLORS_ID}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						{getAreaStops()}
					</linearGradient>
				</defs>
				<Area
					type="monotone"
					dataKey="y"
					stroke={`url(#${CUSTOM_LINE_COLORS_ID})`}
					fill={`url(#${CUSTOM_AREA_COLORS_ID})`}
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
				<YAxis
					domain={yDomain}
					ticks={getCustomYTicks(minY, maxY)}
					tickFormatter={(tick) =>
						BigNum.from(tick, QUOTE_PRECISION_EXP).toNotional()
					}
					axisLine={false}
				/>
				{/* @ts-ignore */}
				<Tooltip content={(props) => <CustomTooltip {...props} />} />
			</AreaChart>
		</ResponsiveContainer>
	);
}
