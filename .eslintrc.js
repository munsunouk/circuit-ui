module.exports = {
	parserOptions: {
		sourceType: 'module',
	},
	plugins: ['react-hooks'],
	extends: ['plugin:react/recommended', 'next'],
	env: {
		es6: true,
		browser: true,
		jest: true,
		node: true,
	},
	settings: {
		react: {
			version: 'detect',
		},
		'import/resolver': {
			node: {
				extensions: ['.ts', '.tsx'],
			},
		},
	},
	rules: {
		'react-hooks/exhaustive-deps': 'off',
		'react/no-unknown-property': 'off',
		'react/react-in-jsx-scope': 0,
		'no-restricted-imports': [
			'error',
			{
				patterns: [
					{
						// Restrict importing from ../protocol/sdk ... the matching pattern isn't ideal, but something weird about eslint isn't letting `*/protocol/sdk/*` match, which would be much more specific.
						// --- I think this will cause errors if we ever use a package or create a folder called `protocol` in the ui project .. not going to worry for now
						group: ['protocol'],
						message: 'Import from @drift-labs/sdk instead',
					},
				],
			},
		],
	},
};
