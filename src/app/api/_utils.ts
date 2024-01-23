export const checkQueryIsNumber = (
	query: string | null,
	defaultVal: number
) => {
	if (!query) return defaultVal;

	const parsedQuery = parseInt(query);
	return isNaN(parsedQuery) ? defaultVal : parsedQuery;
};
