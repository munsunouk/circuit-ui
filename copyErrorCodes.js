const fs = require('fs');
const path = require('path');
const vaultsIdl = require('./drift-vaults/ts/sdk/src/idl/drift_vaults.json');

const UI_VAULTS_ERRORS_FILE_NAME = 'vaultsErrors.json';

let uiErrors = {
	errorsList: {},
};

try {
	uiErrors = require(`./src/constants/${UI_VAULTS_ERRORS_FILE_NAME}`);
} catch (e) {
	console.log("UI Vaults errors file doesn't exist yet");
}

// errorCodesMap should get reset every time, because the numbers could potentially change in the protocol's output
// UI will use this to map the error code (number) to the name, so we can keep our manually added messages identified by the name but independent of the number
uiErrors.errorCodesMap = {};

vaultsIdl.errors.forEach((err) => {
	uiErrors.errorCodesMap[err.code] = err.name;
	if (!uiErrors.errorsList[err.name]) {
		uiErrors.errorsList[err.name] = err;
	} else {
		// Only update error code in errorsList
		uiErrors.errorsList[err.name].code = err.code;
	}
});

const copyErrorCodes = () => {
	fs.writeFileSync(
		path.join(__dirname, 'src', 'constants', UI_VAULTS_ERRORS_FILE_NAME),
		`${JSON.stringify(uiErrors, null, '	')}\n`
	);
};

module.exports = copyErrorCodes;
