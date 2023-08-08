import * as React from 'react';
import type { SVGProps } from 'react';

const SvgTwitter = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 20 20"
		{...props}
	>
		<path
			stroke="#fff"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={0.5}
			d="M16.141 6.896v.416c0 4.196-3.183 9.005-9.008 9.005a8.808 8.808 0 0 1-4.842-1.438c.25.034.502.05.754.046a6.355 6.355 0 0 0 3.934-1.35 3.15 3.15 0 0 1-2.959-2.204c.197.042.399.063.6.062.282 0 .562-.037.834-.112a3.154 3.154 0 0 1-2.538-3.104v-.042c.439.245.93.38 1.433.392a3.142 3.142 0 0 1-.995-4.192 8.992 8.992 0 0 0 6.533 3.308 2.658 2.658 0 0 1-.088-.725 3.146 3.146 0 0 1 5.488-2.212 6.495 6.495 0 0 0 2.012-.771 3.187 3.187 0 0 1-1.412 1.78 6.612 6.612 0 0 0 1.82-.526 6.483 6.483 0 0 1-1.566 1.667Z"
		/>
	</svg>
);
export default SvgTwitter;
