'use client';

import {
	DetailedHTMLProps,
	ForwardedRef,
	HTMLAttributes,
	ReactNode,
	forwardRef,
	useEffect,
	useState,
} from 'react';
import { twMerge } from 'tailwind-merge';

type FadeInDivProps = DetailedHTMLProps<
	HTMLAttributes<HTMLDivElement>,
	HTMLDivElement
> & {
	duration?: number;
	delay?: number;
	fadeCondition?: boolean;
	children: ReactNode;
};

const FadeInDiv = forwardRef(function FadeInDiv(
	{
		children,
		duration = 300,
		delay = 0,
		fadeCondition,
		className,
		...rest
	}: FadeInDivProps,
	ref: ForwardedRef<HTMLDivElement>
) {
	const [isMounted, setIsMounted] = useState(false); // fallback if fadeCondition is not provided

	if (fadeCondition === undefined) {
		fadeCondition = isMounted;
	}

	useEffect(() => {
		setIsMounted(true);

		return () => setIsMounted(false);
	}, []);

	return (
		<div
			className={twMerge(
				'transition-opacity',
				fadeCondition ? 'opacity-100' : 'opacity-0',
				className
			)}
			style={{
				transitionDuration: `${duration}ms`,
				transitionDelay: `${delay}ms`,
			}}
			ref={ref}
			{...rest}
		>
			{children}
		</div>
	);
});

export default FadeInDiv;
