import vaultsErrors from '../constants/vaultsErrors.json';
import NOTIFICATION_UTILS from './notifications';

const COMMON_ERRORS = [
	{
		match: /Blockhash not found/,
		message:
			'There was an error sending the transaction. You likely need to refresh or try using another RPC provider available from the settings menu.',
	},
	{
		match: /NotSubscribedError/,
		message:
			'Sorry, there was an error performing that transaction, please try again. You may need to try refreshing the page.',
	},
	{
		match: /custom program error: 0x1$/,
		message:
			"The wallet didn't have enough balance to complete the transaction",
	},
	{
		match: /User rejected the request/,
		message: 'You rejected the transaction request',
	},
	{
		match: /is below vault min_deposit_amount/,
		message: 'You did not hit the minimum deposit.',
	},
];

export class TransactionErrorHandler {
	public static handle(
		error: any,
		options?: {
			fallbackDescription?: string;
			toastId?: string;
		}
	): void {
		console.error(error);

		if (error?.logs) {
			console.error(error.logs);
		}

		// Common errors
		const commonError = COMMON_ERRORS.find(
			(commonError) => !!error?.message?.match(commonError.match)
		);

		if (commonError) {
			NOTIFICATION_UTILS.toast.error(commonError.message, {
				toastId: options?.toastId,
			});
			return;
		}

		// Custom program errors
		let errorCode = error?.code;
		if (!errorCode && error?.message) {
			const matches = error.message.match(
				/custom program error: (0x[0-9a-f]+)/
			);
			if (matches && matches[1]) {
				errorCode = parseInt(matches[1], 16);
			}
		}

		const errorName =
			vaultsErrors.errorCodesMap[
				`${errorCode}` as keyof typeof vaultsErrors.errorCodesMap
			];
		const mappedError =
			vaultsErrors.errorsList[
				errorName as keyof typeof vaultsErrors.errorsList
			];

		if (mappedError) {
			NOTIFICATION_UTILS.toast.error(this.spacedOutErrorName(mappedError.name));
			return;
		}

		// Generic error
		NOTIFICATION_UTILS.toast.error(
			options?.fallbackDescription ||
				'There was an error performing that transaction, please try again.'
		);
		return;
	}

	private static spacedOutErrorName(errorName: string) {
		const split = errorName.split(/(?=[A-Z])/);
		return split.join(' ');
	}
}
