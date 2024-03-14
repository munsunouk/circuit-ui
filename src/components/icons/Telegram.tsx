import * as React from 'react';
import type { SVGProps } from 'react';

const SvgTelegram = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		fill="none"
		viewBox="0 0 20 20"
		{...props}
	>
		<path
			fill="#fff"
			d="M18.302 2.283a.39.39 0 0 0-.398-.068L2.07 8.41a.798.798 0 0 0 .137 1.528l4.355.854v4.832a.938.938 0 0 0 1.61.65l2.188-2.266 3.36 2.946a.938.938 0 0 0 1.533-.493l3.173-13.797a.39.39 0 0 0-.125-.382M2.188 9.17a.166.166 0 0 1 .11-.177l13.645-5.34-9.14 6.55-4.474-.877a.166.166 0 0 1-.141-.156m5.536 6.67a.313.313 0 0 1-.537-.215v-4.399l2.702 2.367zm6.92.48a.312.312 0 0 1-.513.163l-6.754-5.922 10.29-7.374z"
		/>
	</svg>
);
export default SvgTelegram;
