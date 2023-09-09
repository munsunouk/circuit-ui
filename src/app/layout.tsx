import type { Metadata } from 'next';

import AppWrapper from '@/components/AppWrapper';
import ToastContainer from '@/components/elements/ToastContainer';
import Footer from '@/components/layouts/Footer';
import TailwindClassBufferer from '@/components/layouts/TailwindClassBufferer';
import TopBar from '@/components/layouts/TopBar';
import FloatingUi from '@/components/modals/FloatingUi';

import { sourceSans3 } from '@/constants/fonts';

import './globals.css';

export const metadata: Metadata = {
	title: 'Circuit',
	description: 'Circuit by Drift Protocol',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={sourceSans3.className}>
				<AppWrapper>
					<div className="relative min-h-screen">
						<TopBar />
						<div className="flex justify-center w-full">
							<div className="max-w-[1440px] [&>div]:w-full w-full xl:px-[135px] px-3 pb-20">
								{children}
							</div>
						</div>
						<div className="flex justify-center w-full mt-10">
							<div className="max-w-[1440px] w-full xl:px-[146px] px-5 pb-20 text-gray-500">
								<div className="h-[1px] mb-2 bg-gray-700 w-full" />
								<span className="underline">Disclaimer</span>
								<br />
								Any figures or numerical statements expressed on this interface
								such as total earnings, return or annual percentage yield are
								for estimation and informational purposes only and is not
								guaranteed. Users should consult with qualified professionals
								before making a decision to use this interface. Your use of the
								interface is subject to market risk and may result in a negative
								return. While we make every effort to ensure the interface is up
								to date, we do not guarantee the accuracy, completeness or
								currency of the information on this interface. Users are
								expected to exercise due diligence and verify information
								independently.
							</div>
						</div>
						<Footer />
						<FloatingUi />
						<ToastContainer />
						<TailwindClassBufferer />
					</div>
				</AppWrapper>
			</body>
		</html>
	);
}
