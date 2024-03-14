import * as React from 'react';
import type { SVGProps } from 'react';

const SvgChevron = (props: SVGProps<SVGSVGElement>) => (
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
			d="m27 14.55-8.49 8.49-8.49-8.49 1.065-1.05 7.425 7.425 7.425-7.425z"
		/>
	</svg>
);
export default SvgChevron;
