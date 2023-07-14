import * as React from 'react';
import type { SVGProps } from 'react';

const SvgExternalLink = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 24 24"
		{...props}
	>
		<path stroke="#fff" d="m12 12 9-9m0 0h-7m7 0v7.5M8 3H3v18h18v-5.5" />
	</svg>
);
export default SvgExternalLink;
