import { twMerge } from 'tailwind-merge';

import MarketIcon from './MarketIcon';

type InputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement
>;

export default function Input({ className, ...rest }: InputProps) {
	return (
		<input
			className={twMerge(
				'w-full h-12 px-4 text-lg font-semibold bg-black focus:outline-none focus:border-container-border-selected text-text-emphasis border border-container-border-light',
				className
			)}
			{...rest}
		/>
	);
}

export const CollateralInput = ({
	amount,
	setAmount,
	marketSymbol,
	disabled,
}: {
	amount: string;
	setAmount: (amount: string) => void;
	marketSymbol: string;
	disabled?: boolean;
}) => {
	return (
		<div
			className={twMerge(
				'flex items-center border border-container-border-light',
				'focus-within:border-container-border-selected',
				disabled && 'border-container-border-disabled'
			)}
		>
			<Input
				className="border-0 peer"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
			/>
			<div
				className={twMerge(
					'flex items-center justify-center flex-1 h-12 font-medium border-l border-container-border-light px-7',
					'peer-focus:border-container-border-selected',
					disabled && 'border-container-border-disabled'
				)}
			>
				<MarketIcon marketName={marketSymbol} className="mr-1" />
				{marketSymbol}
			</div>
		</div>
	);
};
