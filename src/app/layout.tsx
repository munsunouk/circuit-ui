import type { Metadata } from 'next';

import AppWrapper from '@/components/AppWrapper';
import ToastContainer from '@/components/elements/ToastContainer';
import TopBar from '@/components/layouts/TopBar';
import FloatingUi from '@/components/modals/FloatingUi';

import { sourceSans3 } from '@/constants/fonts';

import './globals.css';

export const metadata: Metadata = {
	title: 'Circuits',
	description: 'Circuits by Drift Protocol',
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
					<div className="min-h-screen backdrop">
						<TopBar />
						<div className="flex justify-center w-full">
							<div className="max-w-[1440px] [&>div]:w-full w-full xl:px-[135px] lg:px-20 px-10 pb-20">
								{children}
							</div>
						</div>
						<FloatingUi />
						<ToastContainer />
					</div>
				</AppWrapper>
			</body>
		</html>
	);
}
