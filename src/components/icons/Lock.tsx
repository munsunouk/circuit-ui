import * as React from 'react';
import type { SVGProps } from 'react';

const SvgLock = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 16 16"
		{...props}
	>
		<path
			stroke="#000"
			strokeLinecap="round"
			strokeWidth={0.667}
			d="M5.333 6.667v-2a2.667 2.667 0 0 1 5.333 0v2"
		/>
		<path
			stroke="#000"
			strokeLinejoin="round"
			strokeWidth={0.667}
			d="M3.333 6.667h9.333v6A1.333 1.333 0 0 1 11.333 14H4.666a1.333 1.333 0 0 1-1.333-1.334z"
		/>
	</svg>
);
export default SvgLock;
