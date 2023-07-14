import { twMerge } from 'tailwind-merge';

export default function ConnectButton({ className }: { className?: string }) {
	return (
		<button
			className={twMerge(
				'bg-white text-black w-full text-center py-5 font-medium',
				className
			)}
		>
			Connect Wallet
		</button>
	);
}
