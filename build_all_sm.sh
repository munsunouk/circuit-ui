cd drift-common && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && cd ..
cd drift-common/protocol/sdk && rm -rf node_modules && yarn && yarn build && yarn link && cd ../../..
cd drift-common/common-ts && rm -rf package-lock.json && rm -rf node_modules && yarn && yarn link @drift-labs/sdk && yarn build && yarn link && cd ../..
cd drift-common/icons && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn build && yarn link && cd ../..
cd drift-common/react && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn build && yarn link @drift-labs/sdk && yarn link @drift/common && yarn link @drift-labs/icons && yarn link && cd ../..
rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn link @drift-labs/react && yarn link @drift-labs/sdk && yarn link @drift/common-ts && yarn link @drift-labs/icons && yarn build