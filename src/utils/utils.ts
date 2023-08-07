import dayjs from 'dayjs';

export const redeemPeriodToString = (seconds = 0) => {
	const hours = seconds / 60 / 60;
	if (hours < 24) {
		return `${hours} hours`;
	} else {
		return `${hours / 24} days ${hours % 24} hours`;
	}
};

export const getRpcLatencyColor = (latency: number | undefined) => {
	return !latency || latency < 0
		? 'bg-container-border-light'
		: latency < 250
		? 'bg-success-green-border'
		: latency < 500
		? 'bg-warning-yellow-border'
		: 'bg-error-red-border';
};

// replace space with '-', and uri encode vault name
export const encodeVaultName = (name: string) => {
	return encodeURIComponent(name.toLowerCase().replace(/\s/g, '-'));
};

export const normalizeDate = (unixTs: number) => {
	return dayjs(dayjs.unix(unixTs).format('MM/DD/YYYY')).unix();
};
