import { twMerge } from 'tailwind-merge';

import { sourceCodePro } from '@/constants/fonts';

const BreakdownRow = ({ label, value }: { label: string; value: string }) => {
	return (
		<div className="flex justify-between md:text-xl">
			<span>{label}</span>
			<span className={twMerge(sourceCodePro.className, 'text-text-emphasis')}>
				{value}
			</span>
		</div>
	);
};

export default BreakdownRow;
