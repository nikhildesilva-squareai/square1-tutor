'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

type WWavePathProps = React.ComponentProps<'div'>;

export function WavePath({ className, ...props }: WWavePathProps) {
	const path = useRef<SVGPathElement>(null);
	const wrap = useRef<HTMLDivElement>(null);
	let progress = 0;
	let x = 0.2;
	let time = Math.PI / 2;
	let reqId: number | null = null;

	useEffect(() => {
		setPath(progress);
		// The path is drawn in absolute pixels, so it has to be redrawn whenever
		// the element's width changes — otherwise it keeps the width it was first
		// rendered at and stops short of (or overshoots) the edge after a resize
		// or an orientation change.
		if (!wrap.current || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => setPath(progress));
		ro.observe(wrap.current);
		return () => ro.disconnect();
	}, []);

	const setPath = (progress: number) => {
		// Measure the element rather than the viewport: the divider is full-bleed,
		// and reading window.innerWidth would ignore any padding or scrollbar and
		// leave the curve misaligned with its own container.
		//
		// Fall back to the viewport if the measurement is 0. That happens before
		// layout has settled (and in headless renderers that never composite), and
		// a 0-width path draws nothing at all — the ResizeObserver above corrects
		// it the moment a real width exists.
		const measured = wrap.current?.getBoundingClientRect().width ?? 0;
		const width = measured > 0 ? measured : window.innerWidth;
		if (path.current) {
			path.current.setAttributeNS(
				null,
				'd',
				`M0 100 Q${width * x} ${100 + progress * 0.6}, ${width} 100`,
			);
		}
	};

	const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

	const manageMouseEnter = () => {
		if (reqId) {
			cancelAnimationFrame(reqId);
			resetAnimation();
		}
	};

	const manageMouseMove = (e: React.MouseEvent) => {
		const { movementY, clientX } = e;
		if (path.current) {
			const pathBound = path.current.getBoundingClientRect();
			x = (clientX - pathBound.left) / pathBound.width;
			progress += movementY;
			setPath(progress);
		}
	};

	const manageMouseLeave = () => {
		animateOut();
	};

	const animateOut = () => {
		const newProgress = progress * Math.sin(time);
		progress = lerp(progress, 0, 0.025);
		time += 0.2;
		setPath(newProgress);
		if (Math.abs(progress) > 0.75) {
			reqId = requestAnimationFrame(animateOut);
		} else {
			resetAnimation();
		}
	};

	const resetAnimation = () => {
		time = Math.PI / 2;
		progress = 0;
	};

	return (
		<div ref={wrap} className={cn('relative h-px w-full', className)} {...props}>
			<div
				onMouseEnter={manageMouseEnter}
				onMouseMove={manageMouseMove}
				onMouseLeave={manageMouseLeave}
				className="relative -top-5 z-10 h-10 w-full hover:-top-[150px] hover:h-[300px]"
			/>
			{/* Visual only — never intercept clicks on the surrounding sections */}
			<svg className="pointer-events-none absolute -top-[100px] h-[300px] w-full">
				<path ref={path} className="fill-none stroke-current" strokeWidth={2.5} />
			</svg>
		</div>
	);
}
