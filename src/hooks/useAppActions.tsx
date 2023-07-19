import { useCommonDriftStore } from '@drift-labs/react';
import { useCallback, useEffect, useState } from 'react';

import createAppActions from '../actions/appActions';
import useAppStore from './useAppStore';

/**
 * Returns the common Drift actions object.
 */
export function useAppActions(): ReturnType<typeof createAppActions> {
	const [getStore, setStore] = useAppStore((s) => [s.get, s.set]);
	const [getCommonStore, setCommonStore] = useCommonDriftStore((s) => [
		s.get,
		s.set,
	]);

	const getActions = useCallback(() => {
		return createAppActions(getCommonStore, setCommonStore, getStore, setStore);
	}, [getStore, setStore, getCommonStore, setCommonStore]);

	const [actions, setActions] = useState(getActions());

	useEffect(() => {
		setActions(getActions());
	}, [getActions]);

	return actions;
}
