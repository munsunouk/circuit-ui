import { usePathname } from 'next/navigation';

import { DEFAULT_VAULT_PUBKEY } from '@/constants/vaults';

const getVaultName = (pathname: string) => {
	switch (pathname) {
		case '/':
			return DEFAULT_VAULT_PUBKEY;
		default:
			return null;
	}
};

export default function usePathToVaultPubKey() {
	const pathname = usePathname();

	return getVaultName(pathname);
}
