import * as React from 'react';
import type { SVGProps } from 'react';

const SvgDisclaimers = (props: SVGProps<SVGSVGElement>) => (
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
			d="M9.167 2v3.6h3.5M9.458 2H4.5c-.31 0-.606.126-.825.351-.219.226-.342.53-.342.849v9.6c0 .318.123.624.342.848.219.226.516.352.825.352h7c.31 0 .606-.126.825-.351s.342-.53.342-.849V5.3z"
		/>
	</svg>
);
export default SvgDisclaimers;
