import { PERCENTAGE_PRECISION } from '@drift-labs/sdk';

import useCurrentVaultAccountData from '@/hooks/useCurrentVaultAccountData';

import SectionHeader from '../SectionHeader';
import FadeInDiv from '../elements/FadeInDiv';

export default function VaultOverview() {
	const vaultAccountData = useCurrentVaultAccountData();

	const profitShareFeeString =
		(vaultAccountData?.profitShare ?? 0) / PERCENTAGE_PRECISION.toNumber();

	return (
		<div className="flex flex-col w-full gap-8 md:gap-16">
			<FadeInDiv className="flex flex-col w-full gap-6">
				<SectionHeader>Strategy</SectionHeader>
				<div>
					<span>
						Supercharger vault employs a delta-neutral market making and
						liquidity provision strategy, primarily on Drift perpetual swaps.
						The strategy edge is in advanced volatility and inventory management
						models and a superior on-chain infrastructure setup.
					</span>
					<br />
					<br />
					<span className="font-semibold text-text-emphasis">
						The strategy is built on a smart contract, meaning funds cannot be
						withdrawn by anyone but you.
					</span>
				</div>
			</FadeInDiv>
			<FadeInDiv className="flex flex-col w-full gap-6" delay={100}>
				<SectionHeader>Risks</SectionHeader>
				<div>
					<div className="mb-1 font-semibold text-text-semi-emphasis">
						Volatility Risk
					</div>
					<div>
						Supercharger vault is exposed to volatility risk because rapid and
						large price movements can impact its ability to buy or sell
						instrument at desired prices. High volatility can widen bid-ask
						spreads, reducing profitability for the vault.
					</div>
				</div>
				<div>
					<div className="mb-1 font-semibold text-text-semi-emphasis">
						Counterparty Risk
					</div>
					<div>
						Supercharger vault faces counterparty risk when dealing with other
						market participants. If vault enters into trades with a counterparty
						and the counterparty fails to fulfill their obligations, such as
						failing to deliver securities or make payment, the market maker may
						suffer financial losses.
					</div>
				</div>
			</FadeInDiv>
			<FadeInDiv className="flex flex-col w-full gap-4" delay={200}>
				<SectionHeader>Lock Up Period & Withdrawals</SectionHeader>
				<div>
					<span>Deposited funds are subject to a [period] period.</span>
					<br />
					<br />
					<span>
						Withdrawals can be requested at any time. Funds will be made
						available for withdrawal at the end of each quarter.
					</span>
				</div>
			</FadeInDiv>
			<FadeInDiv className="flex flex-col w-full gap-4" delay={300}>
				<SectionHeader>Fees</SectionHeader>
				<div>
					<span>A performance fee of {profitShareFeeString}% applies.</span>
					<br />
					<br />
					<span>
						For deposits over $250,000, contact us to learn more about our White
						Glove service.
					</span>
				</div>
			</FadeInDiv>
		</div>
	);
}
