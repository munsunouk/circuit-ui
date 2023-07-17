import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = DetailedHTMLProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
> & {
	secondary?: boolean;
	Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
};

const Button = ({
	className,
	children,
	secondary,
	disabled,
	Icon,
	...rest
}: ButtonProps) => {
	return (
		<button
			className={twMerge(
				'bg-white text-black w-full text-center py-5 font-semibold hover:bg-main-blue active:bg-container-bg-selected transition-all duration-300 active:text-text-emphasis cursor-pointer flex gap-4 justify-center items-center group',
				secondary &&
					'bg-black text-text-emphasis border-white border hover:border-main-blue hover:text-black active:border-secondary-blue w-auto py-2 px-4',
				disabled &&
					'bg-button-bg-disabled active:bg-button-bg-disabled hover:bg-button-bg-disabled active:text-black cursor-not-allowed',
				Icon && 'transition-none',
				className
			)}
			disabled={disabled}
			{...rest}
		>
			{Icon ? (
				<>
					<span>{children}</span>
					{Icon && (
						<Icon
							width={24}
							height={24}
							className="[&>path]:group-hover:stroke-black [&>path]:group-active:stroke-white"
						/>
					)}
				</>
			) : (
				<>{children}</>
			)}
		</button>
	);
};

export default Button;
