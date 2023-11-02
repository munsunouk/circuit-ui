import { BigNum, QUOTE_PRECISION_EXP } from '@drift-labs/sdk';
import { EventType, WrappedEvent } from '@drift-labs/vaults-sdk';
import { ENUM_UTILS } from '@drift/common';
import dayjs from 'dayjs';

import useAppStore from '@/hooks/useAppStore';

import { shortenPubkey } from '@/utils/utils';

import Row from '../elements/Row';
import { Modal } from './Modal';

export default function ActionRecordModal({
	actionRecord,
}: {
	actionRecord: WrappedEvent<EventType>;
}) {
	const setAppStore = useAppStore((s) => s.set);

	const handleOnClose = () => {
		setAppStore((s) => {
			s.modals.showActionRecordModal = {
				show: false,
			};
		});
	};

	return (
		<Modal onClose={handleOnClose} header="Action Record" className="w-[500px]">
			<div className="flex flex-col">
				<Row label="Action" value={ENUM_UTILS.toStr(actionRecord.action)} />
				<Row
					label="Timestamp"
					value={dayjs
						.unix(actionRecord.ts.toNumber())
						.format('DD MMM YYYY HH:mm:ss')}
				/>
				<Row
					label="Vault"
					value={shortenPubkey(actionRecord.vault.toString(), 8)}
				/>
				<Row
					label="Depositor Authority"
					value={shortenPubkey(actionRecord.depositorAuthority.toString(), 8)}
				/>
				<Row
					label="Amount"
					value={BigNum.from(
						actionRecord?.amount,
						QUOTE_PRECISION_EXP
					).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
				/>
				<Row
					label="Spot Market Index"
					value={actionRecord.spotMarketIndex.toString()}
				/>
				<Row
					label="Vault Shares Before"
					value={BigNum.from(actionRecord?.vaultSharesBefore, 6).toPrecision(6)}
				/>
				<Row
					label="Vault Shares After"
					value={BigNum.from(actionRecord?.vaultSharesAfter, 6).toPrecision(6)}
				/>
				<Row
					label="Vault Equity Before"
					value={BigNum.from(actionRecord?.vaultEquityBefore, 6).toPrecision(6)}
				/>
				<Row
					label="User Vault Shares Before"
					value={BigNum.from(
						actionRecord?.userVaultSharesBefore,
						6
					).toPrecision(6)}
				/>
				<Row
					label="Total Vault Shares Before"
					value={BigNum.from(
						actionRecord?.totalVaultSharesBefore,
						6
					).toPrecision(6)}
				/>
				<Row
					label="User Vault Shares After"
					value={BigNum.from(actionRecord?.userVaultSharesAfter, 6).toPrecision(
						6
					)}
				/>
				<Row
					label="Total Vault Shares After"
					value={BigNum.from(
						actionRecord?.totalVaultSharesAfter,
						6
					).toPrecision(6)}
				/>
				<Row
					label="Profit Share"
					value={BigNum.from(
						actionRecord?.profitShare,
						QUOTE_PRECISION_EXP
					).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
				/>
				<Row
					label="Management Fee"
					value={BigNum.from(
						actionRecord?.managementFee,
						QUOTE_PRECISION_EXP
					).toPrecision(QUOTE_PRECISION_EXP.toNumber())}
				/>
				<Row
					label="Management Fee Shares"
					value={BigNum.from(actionRecord?.managementFeeShares, 6).toPrecision(
						6
					)}
				/>
			</div>
		</Modal>
	);
}
