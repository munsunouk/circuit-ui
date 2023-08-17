const ButtonLink = ({
	Icon,
	label,
	onClick,
}: {
	Icon: React.FC<React.SVGProps<SVGSVGElement>>;
	label: string;
	onClick: () => void;
}) => {
	return (
		<span
			className="flex items-center gap-2 cursor-pointer group"
			onClick={onClick}
		>
			<Icon
				width={24}
				height={24}
				className="group-hover:[&>path]:stroke-text-button-link-hover group-active:[&>path]:stroke-text-button-link-active [&>path]:transition-all"
			/>
			<span className="transition-all text-text-emphasis group-hover:text-text-button-link-hover group-active:text-text-button-link-active">
				{label}
			</span>
		</span>
	);
};

export default ButtonLink;
