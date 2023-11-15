import { COMMON_UI_UTILS } from '@drift/common';
import Image from 'next/image';
import { CSSProperties } from 'react';
import { twMerge } from 'tailwind-merge';

import { MARKET_ICON_PATH } from '@/constants/misc';

const MarketIcon = ({
	marketName,
	className,
	style,
	customHeight,
	customWidth,
	isSpot,
}: {
	marketName: string;
	className?: string;
	style?: CSSProperties;
	sizeClass?: string;
	customHeight?: number;
	customWidth?: number;
	isSpot?: boolean;
}) => {
	const baseSymbol = COMMON_UI_UTILS.getBaseAssetSymbol(
		marketName,
		true
	).toLowerCase();

	let src = `${MARKET_ICON_PATH}/${baseSymbol}${isSpot ? '-spot' : ''}.svg`;

	if (baseSymbol === 'bonk' || baseSymbol === 'pepe') {
		src = src.replace('svg', 'png');
	}

	return (
		<Image
			src={src}
			className={twMerge(className)}
			style={style}
			width={customWidth ?? 18}
			height={customHeight ?? 18}
			alt={`${marketName} icon`}
		/>
	);
};

export default MarketIcon;
