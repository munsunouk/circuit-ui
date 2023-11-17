import React from 'react';
import { twMerge } from 'tailwind-merge';

import Table, { TableProps } from '@/components/elements/Table';

function VaultDataTableBaseUnMemoed<T>({ className, ...rest }: TableProps<T>) {
	return (
		<Table
			{...rest}
			className={twMerge('border-t-0  max-h-[200px] min-h-[200px]', className)}
		/>
	);
}

export const VaultDataTableBase = React.memo<TableProps<any>>(
	VaultDataTableBaseUnMemoed
);
