const copyErrorCodes = require('./copyErrorCodes.js');

const nextConfig = {
	webpack(config, { isServer }) {
		if (!isServer) {
			config.resolve.fallback.fs = false;
			copyErrorCodes();
		}

		if (process.env.VERCEL_ENV === 'preview') {
			config.optimization.minimize = false;
		}

		return config;
	},
};

module.exports = nextConfig;
