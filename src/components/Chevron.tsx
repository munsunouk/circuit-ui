import { SVGProps } from 'react';
import { twMerge } from 'tailwind-merge';

import ChevronIcon from '@/components/icons/Chevron';

type ChevronProps = {
	open?: boolean;
} & SVGProps<SVGSVGElement>;

export default function Chevron({ open, ...rest }: ChevronProps) {
	return (
		<span
			className={twMerge(
				'transition-transform duration-300',
				open ? 'rotate-180' : 'rotate-0'
			)}
		>
			<ChevronIcon {...rest} />
		</span>
	);
}
