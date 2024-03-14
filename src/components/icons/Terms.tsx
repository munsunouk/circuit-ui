import * as React from 'react';
import type { SVGProps } from 'react';

const SvgTerms = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 16 16"
		{...props}
	>
		<path
			stroke="#CDCDCD"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={1.5}
			d="m6.25 8 .808.831a.5.5 0 0 0 .717 0L9.75 6.8M12.667 8c0 3.124-3.514 5.344-4.444 5.877a.44.44 0 0 1-.446 0c-.93-.533-4.444-2.753-4.444-5.877V4.143a.5.5 0 0 1 .32-.466L7.82 2.069a.5.5 0 0 1 .36 0l4.167 1.608a.5.5 0 0 1 .32.466z"
		/>
	</svg>
);
export default SvgTerms;
