import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

import { Loading } from '../icons';

type ButtonProps = DetailedHTMLProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
> & {
	secondary?: boolean;
	loading?: boolean;
	Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
	innerClassName?: string;
};

const Button = ({
	className,
	children,
	secondary,
	loading,
	disabled,
	Icon,
	innerClassName,
	...rest
}: ButtonProps) => {
	return (
		<button
			className={twMerge(
				'bg-white text-black w-full text-center py-5 font-semibold hover:bg-main-blue active:bg-container-bg-selected transition-all active:text-text-emphasis cursor-pointer flex gap-4 justify-center items-center group',
				secondary &&
					'bg-black text-text-emphasis border-white border hover:border-main-blue hover:text-black active:border-secondary-blue w-auto py-2 px-4',
				(disabled || loading) &&
					'bg-button-bg-disabled active:bg-button-bg-disabled hover:bg-button-bg-disabled active:text-black cursor-not-allowed',
				className
			)}
			disabled={disabled || loading}
			{...rest}
		>
			{Icon ? (
				<>
					<span className="relative">{children}</span>
					{Icon && (
						<Icon
							width={24}
							height={24}
							className="[&>path]:group-hover:stroke-black [&>path]:group-active:stroke-white [&>path]:transition-all"
						/>
					)}
				</>
			) : (
				<span className={twMerge('relative', innerClassName)}>
					{children}
					{loading && (
						<span className="absolute top-0 right-[calc(100%+4px)] bottom-0 flex items-center justify-center">
							<Loading className="w-4 h-4 animate-spin" />
						</span>
					)}
				</span>
			)}
		</button>
	);
};

export default Button;
