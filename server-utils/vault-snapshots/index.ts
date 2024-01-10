// fetch all vault accounts
// output into serialized format
import { getDriftVaultProgram } from '@drift-labs/vaults-sdk';
import { COMMON_UI_UTILS, EnvironmentConstants } from '@drift/common';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';

const fetchMultipleAccounts = async (
	connection: Connection,
	publicKeys: PublicKey[],
	commitment: Commitment = 'processed'
) => {
	const result = await connection.getMultipleAccountsInfo(
		publicKeys,
		commitment
	);
	return result;
};

const snapshotVaults = async (vaultPubKeys: PublicKey[]) => {
	const connection = new Connection(
		EnvironmentConstants.rpcs.mainnet[1].value,
		'processed'
	);
	const dummyWallet = COMMON_UI_UTILS.createThrowawayIWallet();
	const program = getDriftVaultProgram(connection, dummyWallet);

	const accountInfos = await fetchMultipleAccounts(connection, vaultPubKeys);

	accountInfos.forEach((accInfo) => {
		if (!accInfo) return;
		const account = program.account.vault.coder.accounts.decode(
			'vault',
			accInfo.data
		);
		console.log(
			'🚀 ~ file: index.ts:44 ~ getVaultsSnapshots ~ account:',
			account
		);
	});
};

snapshotVaults([new PublicKey('GXyE3Snk3pPYX4Nz9QRVBrnBfbJRTAQYxuy5DRdnebAn')]);
