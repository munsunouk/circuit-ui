'use client';

import { Close } from '@drift-labs/icons';
import {
	MutableRefObject,
	PropsWithChildren,
	useEffect,
	useRef,
	useState,
} from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { twMerge } from 'tailwind-merge';

import ModalPortal from './ModalPortal';

const clickedInsideElement = (
	event: MouseEvent,
	element: HTMLElement | null
) => {
	let target = event.target as HTMLElement;
	let clickedInsideElement = false;
	if (element) {
		while (target.parentNode) {
			if (element.contains(target)) {
				clickedInsideElement = true;
				break;
			}
			target = target.parentNode as HTMLElement;
		}
	}
	return clickedInsideElement;
};

export const ModalBackground = (
	props: PropsWithChildren<{
		onClose: () => void;
		contentRef: null | MutableRefObject<any>;
		id?: string;
	}>
) => {
	const backgroundRef = useRef<HTMLDivElement>(null);
	const [isClosing, setIsClosing] = useState(false);

	const closingModalFromBackground = (event: ReactMouseEvent) => {
		const eventWasInsideModal = clickedInsideElement(
			event.nativeEvent,
			backgroundRef?.current
		);

		if (
			!eventWasInsideModal ||
			(props.contentRef?.current.contains(event.target) &&
				event.target !== props.contentRef?.current)
		) {
			return;
		}

		setIsClosing(true);
	};

	useEffect(() => {
		document.body.classList.add(`overflow-hidden`);

		return () => {
			document.body.classList.remove(`overflow-hidden`);
		};
	}, []);

	const handleClose = () => {
		if (isClosing) {
			props.onClose();
		}
	};

	return (
		<div
			className={`fixed z-50 inset-0 w-screen h-screen overflow-auto sm:overflow-hidden backdrop-blur-sm transition-all duration-300`}
			aria-labelledby="modal-title"
			role="dialog"
			aria-modal="true"
			id={props.id}
			onMouseDown={closingModalFromBackground}
			ref={backgroundRef}
		>
			<div className="min-h-screen px-4 pb-20 sm:block sm:p-0">
				<div
					className={`fixed inset-0 transition-opacity bg-opacity-50 flex items-center justify-center`}
					aria-hidden="true"
					onMouseUp={handleClose}
				>
					{props.children}
				</div>

				<span
					className="hidden sm:inline-block sm:align-middle sm:h-screen"
					aria-hidden="true"
				>
					&#8203;
				</span>
			</div>
		</div>
	);
};

type ModalProps = PropsWithChildren<{
	onClose: () => void;
	header?: string;
	className?: string;
	id?: string;
}>;

export const Modal = ({
	onClose,
	children,
	className,
	id,
	header,
}: ModalProps) => {
	const contentRef = useRef<HTMLDivElement | null>(null);

	return (
		<ModalPortal id={id}>
			<ModalBackground onClose={onClose} contentRef={contentRef}>
				<div
					ref={contentRef}
					className={twMerge(
						'p-4 px-2 border bg-container-bg border-container-border md:px-6',
						className
					)}
				>
					<div className="flex justify-between w-full gap-2 mb-2">
						<span className="text-xl text-text-emphasis">{header}</span>
						<button
							onClick={onClose}
							className="flex items-center justify-around transition-opacity duration-300 hover:opacity-80"
						>
							<Close size={24} />
						</button>
					</div>
					{children}
				</div>
			</ModalBackground>
		</ModalPortal>
	);
};
