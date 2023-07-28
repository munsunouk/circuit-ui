import * as React from 'react';
import type { SVGProps } from 'react';

const SvgCheckmark = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 16 16"
		{...props}
	>
		<path
			stroke="#fff"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={0.5}
			d="M11.81 5.143 6.57 10.381l-2.38-2.38"
		/>
		<rect
			width={15.5}
			height={15.5}
			x={0.25}
			y={0.25}
			stroke="#fff"
			strokeWidth={0.5}
			rx={7.75}
		/>
	</svg>
);
export default SvgCheckmark;
