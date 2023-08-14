import useAppStore from '@/hooks/useAppStore';

import Button from '../elements/Button';

export default function DevFunctions() {
	const setStore = useAppStore((s) => s.set);

	const openStoreModal = () => {
		setStore((s) => {
			s.modals.showStoreModal = true;
		});
	};

	return (
		<div>
			<Button onClick={openStoreModal}>Store</Button>
		</div>
	);
}
