export default function Badge({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-main-blue rounded-[1px] text-black text-sm px-2 py-1">
			{children}
		</div>
	);
}
