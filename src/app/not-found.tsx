import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

import Button from '@/components/elements/Button';

import { syne } from '@/constants/fonts';

export default function NotFound() {
	return (
		<div className="w-full pt-[40%] md:pt-[20%] text-center flex flex-col gap-4 items-center">
			<span className={twMerge(syne.className, 'text-xl md:text-4xl')}>
				404 Not Found
			</span>
			<Button className="max-w-[300px] w-full py-3">
				<Link href="/">Return Home</Link>
			</Button>
		</div>
	);
}
