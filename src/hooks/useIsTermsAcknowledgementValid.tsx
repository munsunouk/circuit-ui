import { useLastAcknowledgedTerms } from '@drift-labs/react';

import { ACKNOWLEDGE_TERMS_VALIDITY_DURATION_MS } from '@/constants/misc';

export default function useIsTermsAcknowledgementValid() {
	const { lastAcknowledgedTerms } = useLastAcknowledgedTerms();

	const isAcknowledgementValid =
		!!lastAcknowledgedTerms &&
		Date.now() - lastAcknowledgedTerms < ACKNOWLEDGE_TERMS_VALIDITY_DURATION_MS;

	return isAcknowledgementValid;
}
