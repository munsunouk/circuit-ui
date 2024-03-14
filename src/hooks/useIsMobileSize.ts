import { useWindowSize } from 'react-use';

import { BREAKPOINTS } from '@/constants/breakpoints';

export const useIsMobileSize = () => {
	const { width } = useWindowSize();

	return width < BREAKPOINTS.md;
};
