const getApiRoute = (route: string) => `/api${route}`;

export const API_ROUTES = {
	GET_VAULT_DEPOSITOR_RECORDS: getApiRoute('/vault-depositor-records'),
	GET_VAULT_SNAPSHOTS: getApiRoute('/vault-snapshots'),
};
