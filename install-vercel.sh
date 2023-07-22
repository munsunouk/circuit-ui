# This script ensures that all of our internal modules are installed + linked where required.

# Install root modules
echo "pwd"
pwd

# Install stuff in drift-common

# Install Protocol + SDK
echo "changing directory to drift-common"
cd ./drift-common/protocol
echo "pwd"
pwd
rm -rf cli
echo "yarn install for protocol"
yarn install --ignore-scripts
echo "cd ./sdk"
cd ./sdk 
echo "yarn install for protocol/sdk"
yarn install
echo "yarn link for protocol/sdk"
yarn link 

# Install common-ts
echo "cd ../../common-ts"
cd ../../common-ts
echo "yarn install for common-ts"
yarn install
echo "yarn link for common-ts"
yarn link @drift-labs/sdk
yarn link

# Install icons
echo "cd ../icons"
cd ../icons
echo "yarn install for icons"
yarn install
yarn link

# Install Drift common react
echo "cd ../react"
cd ../react
echo "yarn install for @drift-labs/react"
yarn install
yarn link @drift-labs/sdk
yarn link @drift/common
yarn link @drift-labs/icons
yarn link

# Return to root
echo "cd ../../"
cd ../../

# Install Vaults SDK
echo "cd drift-vaults/ts/sdk"
cd drift-vaults/ts/sdk
echo "yarn install for @drift-labs/vaults-sdk"
yarn install
yarn link

# Return to root
echo "cd ../../../"
cd ../../../

# Install Drift UI
echo "yarn install for ui"
yarn install --frozen-lockfile 
yarn link @drift/common 
yarn link @drift-labs/sdk 
yarn link @drift-labs/icons
yarn link @drift-labs/react
yarn link @drift-labs/vaults-sdk