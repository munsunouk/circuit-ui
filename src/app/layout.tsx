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
