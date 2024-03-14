import * as React from 'react';
import type { SVGProps } from 'react';

const SvgLoading = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 20 20"
		{...props}
	>
		<circle cx={10} cy={10} r={9.5} stroke="#000" />
		<mask id="loading_svg__a" fill="#fff">
			<path d="M20 10a10 10 0 0 1-6.61 9.408l-.338-.938A9 9 0 0 0 19.003 10z" />
		</mask>
		<path
			stroke="#CDCDCD"
			strokeWidth={2}
			d="M20 10a10 10 0 0 1-6.61 9.408l-.338-.938A9 9 0 0 0 19.003 10z"
			mask="url(#loading_svg__a)"
		/>
	</svg>
);
export default SvgLoading;
