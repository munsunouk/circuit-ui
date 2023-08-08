import { CIRCUIT_EMAIL, CIRCUIT_TWITTER_LINK } from '@/constants/misc';

import ButtonLink from '../elements/ButtonLink';
import GradientBorderBox from '../elements/GradientBorderBox';
import { Email, Twitter } from '../icons';

export default function WhiteGloveDetails() {
	const handleTwitterClick = () => {
		window.open(CIRCUIT_TWITTER_LINK, '_blank');
	};

	const handleEmailClick = () => {
		window.open(`mailto:${CIRCUIT_EMAIL}`, '_blank');
	};

	return (
		<GradientBorderBox className="flex flex-col gap-2 px-6 py-5" color="yellow">
			<span>
				For deposits over <span className="font-bold">$250,000</span> contact us
				to learn more about our white glove service.
			</span>
			<div className="flex gap-6">
				<ButtonLink
					Icon={Twitter}
					label="Twitter"
					onClick={handleTwitterClick}
				/>
				<ButtonLink Icon={Email} label="Email" onClick={handleEmailClick} />
			</div>
		</GradientBorderBox>
	);
}
