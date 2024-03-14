import * as React from 'react';
import type { SVGProps } from 'react';

const SvgEmail = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 24 24"
		{...props}
	>
		<path stroke="#fff" strokeWidth={0.5} d="M3 19V5h18v14z" />
		<path stroke="#fff" strokeWidth={0.5} d="m3 7 9 4.5L21 7" />
	</svg>
);
export default SvgEmail;
