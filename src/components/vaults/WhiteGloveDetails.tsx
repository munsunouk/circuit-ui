import GradientBorderBox from '../elements/GradientBorderBox';
import { Email, Telegram } from '../icons';

const ContactOption = ({
	Icon,
	label,
}: {
	Icon: React.FC<React.SVGProps<SVGSVGElement>>;
	label: string;
}) => {
	return (
		<span className="flex items-center gap-2">
			<Icon width={24} height={24} />
			<span className="text-text-emphasis">{label}</span>
		</span>
	);
};

export default function WhiteGloveDetails() {
	return (
		<GradientBorderBox className="flex flex-col gap-2 px-6 py-5" color="yellow">
			<span>
				For deposits over <span className="font-bold">$250,000</span> contact us
				to learn more about our white glove service.
			</span>
			<div className="flex gap-6">
				<ContactOption Icon={Email} label="Email" />
				<ContactOption Icon={Telegram} label="Telegram" />
			</div>
		</GradientBorderBox>
	);
}
