const Row = ({
	label,
	value,
}: {
	label: string;
	value: string | undefined;
}) => (
	<div className="flex justify-between w-full">
		<div>{label}</div>
		<div>{value}</div>
	</div>
);

export default Row;
