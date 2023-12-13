import * as React from 'react';
import type { SVGProps } from 'react';

const SvgArrowRight = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth={1.5}
		className="arrow-right_svg__feather arrow-right_svg__feather-arrow-right"
		viewBox="0 0 24 24"
		{...props}
	>
		<path d="M5 12h14M12 5l7 7-7 7" />
	</svg>
);
export default SvgArrowRight;
