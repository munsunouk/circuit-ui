import Image from 'next/image';

export default function Loading({ text }: { text?: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-4">
			<div className="animate-pulse">
				<Image
					src="/circuits-icon.svg"
					alt="Circuits Icon"
					width="60"
					height="66"
				/>
			</div>
			<div className="loading">
				{text ? text : 'Loading'}
				<span>.</span>
				<span>.</span>
				<span>.</span>
			</div>
		</div>
	);
}
