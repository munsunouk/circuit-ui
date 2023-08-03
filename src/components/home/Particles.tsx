'use client';

import { useCallback } from 'react';
import Particles from 'react-particles';
import type { Engine } from 'tsparticles-engine';
import { loadSlim } from 'tsparticles-slim';

/**
 * Library docs can be found here: https://github.com/tsparticles/react
 */
function CustomParticles({ color }: { color: string }) {
	const particlesInit = useCallback(async (engine: Engine) => {
		// you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
		// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
		// starting from v2 you can add only the features you need reducing the bundle size
		//await loadFull(engine);
		await loadSlim(engine);
	}, []);

	return (
		<Particles
			id={'tsparticles'}
			init={particlesInit}
			width="100%"
			options={{
				fullScreen: {
					enable: false,
				},
				background: {
					color: {
						value: 'transparent',
					},
				},
				fpsLimit: 120,
				particles: {
					color: {
						value: color,
					},
					shadow: {
						blur: 5,
						enable: true,
						color: color,
					},
					opacity: {
						value: 0.8,
					},
					number: {
						value: 30,
					},
					move: {
						direction: 'top',
						enable: true,
						outModes: {
							default: 'out',
							top: 'out',
						},
						random: true,
						speed: { min: 0.1, max: 0.7 },
						straight: true,
					},
					shape: {
						type: 'circle',
					},
					size: {
						value: { min: 1, max: 2 },
					},
				},
				detectRetina: false,
			}}
		/>
	);
}

export default CustomParticles;
