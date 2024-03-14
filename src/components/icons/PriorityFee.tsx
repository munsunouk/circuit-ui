import * as React from 'react';
import type { SVGProps } from 'react';

const SvgPriorityFee = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 17 16"
		{...props}
	>
		<path
			stroke="#CDCDCD"
			strokeWidth={1.5}
			d="M2.583 10a5.917 5.917 0 1 1 11.674 1.371l.73.173-.73-.173a.1.1 0 0 1-.044.061.23.23 0 0 1-.133.04H2.92a.23.23 0 0 1-.133-.04.1.1 0 0 1-.044-.06A6 6 0 0 1 2.583 10Z"
		/>
		<path
			stroke="#CDCDCD"
			strokeWidth={1.5}
			d="M6.421 11.666a2.4 2.4 0 0 1-.143-.823c0-1.284.995-2.324 2.222-2.324s2.222 1.04 2.222 2.324c0 .29-.05.567-.143.823"
		/>
		<path
			stroke="#CDCDCD"
			strokeLinecap="round"
			strokeWidth={1.5}
			d="m9.981 8.889 1.482-1.482"
		/>
	</svg>
);
export default SvgPriorityFee;
