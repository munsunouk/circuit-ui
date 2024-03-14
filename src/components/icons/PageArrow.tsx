import * as React from 'react';
import type { SVGProps } from 'react';

const SvgPageArrow = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 36 36"
		{...props}
	>
		<path
			fill="#fff"
			d="M17.49 27 9 18.51l8.49-8.49 1.05 1.065-7.425 7.425 7.425 7.425z"
		/>
		<path
			fill="#fff"
			d="M25.49 27 17 18.51l8.49-8.49 1.05 1.065-7.425 7.425 7.425 7.425z"
		/>
	</svg>
);
export default SvgPageArrow;
