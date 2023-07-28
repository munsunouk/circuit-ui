import * as React from 'react';
import type { SVGProps } from 'react';

const SvgClose = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 20 20"
		{...props}
	>
		<path
			stroke="#fff"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={0.37}
			d="M15 5 5 15M5 5l10 10"
		/>
	</svg>
);
export default SvgClose;
