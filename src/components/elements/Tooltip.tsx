import { Tooltip as TooltipBase } from 'react-tooltip';

export const Tooltip = ({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) => {
	return (
		<TooltipBase
			id={id}
			border="1px solid var(--container-border-selected)"
			style={{
				borderRadius: 0,
				background: '#000',
			}}
		>
			{children}
		</TooltipBase>
	);
};
