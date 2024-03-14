import * as React from 'react';
import type { SVGProps } from 'react';

const SvgMedium = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 16 16"
		{...props}
	>
		<path
			fill="#fff"
			d="M5.384 4.667C7.254 4.667 8.77 6.159 8.77 8c0 1.84-1.516 3.333-3.385 3.333S2 9.841 2 8c0-1.84 1.515-3.333 3.384-3.333m5.405.195c.935 0 1.692 1.405 1.692 3.138s-.757 3.138-1.692 3.138S9.097 9.733 9.097 8s.758-3.138 1.692-3.138m2.616.327C13.734 5.189 14 6.447 14 8s-.266 2.811-.595 2.811S12.81 9.553 12.81 8s.266-2.811.595-2.811"
		/>
	</svg>
);
export default SvgMedium;
