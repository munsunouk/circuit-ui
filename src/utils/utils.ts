export const redeemPeriodToString = (seconds = 0) => {
	const hours = seconds / 60 / 60;
	if (hours < 24) {
		return `${hours} hours`;
	} else {
		return `${hours / 24} days ${hours % 24} hours`;
	}
};
