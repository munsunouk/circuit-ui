import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';

import AppWrapper from '@/components/AppWrapper';
import TopBar from '@/components/layouts/TopBar';

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
						{children}
					</div>
				</AppWrapper>
			</body>
		</html>
	);
}
