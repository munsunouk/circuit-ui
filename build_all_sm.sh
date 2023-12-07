# cd drift-common && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && cd ..
# cd drift-common/protocol/sdk && rm -rf node_modules && yarn && yarn build && yarn link && cd ../../..
# cd drift-common/common-ts && rm -rf package-lock.json && rm -rf node_modules && yarn && yarn link @drift-labs/sdk && yarn build && yarn link && cd ../..
# cd drift-common/icons && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn build && yarn link && cd ../..
# cd drift-common/react && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn build && yarn link @drift-labs/sdk && yarn link @drift/common && yarn link @drift-labs/icons && yarn link && cd ../..
# cd drift-vaults/ts/sdk && rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn build && yarn link && cd ../../..
# rm -rf package-lock.json && rm -rf yarn.lock && rm -rf node_modules && yarn && yarn link @drift-labs/react && yarn link @drift-labs/sdk && yarn link @drift/common && yarn link @drift-labs/icons && yarn link @drift-labs/vaults-sdk && yarn build

source ./scripts/utils.sh

function print() {
  local message=$1

  echo "#task: ${message}${NC}"
}

install_and_build_package() {
  local package_path=$1
  local links=$2
  local should_run_bun_link=$3
  local should_build=$4

  cd ${package_path} && bun install

  for link in ${links[@]}
  do
      print "bun link for ${folder} -> ${link}"
      bun link ${link}
  done

  if [ "${should_run_bun_link}" = "true" ]; then
    print "Running bun link for ${folder}"
    bun link
  fi

  if [ "${should_build}" = "true" ]; then
    print "Running yarn build for ${folder}"
    yarn build
  fi

  cd - &> /dev/null
}

# Install packages
install_and_build_package "drift-common" "" "" ""
install_and_build_package "drift-common/protocol" "" "" ""
install_and_build_package "drift-common/protocol/sdk" "" "true" "true"
install_and_build_package "drift-common/common-ts" "@drift-labs/sdk" "true" "true"
install_and_build_package "drift-common/icons" "" "true" "true"
install_and_build_package "drift-common/react" "@drift-labs/sdk @drift/common @drift-labs/icons" "true" "true"
install_and_build_package "drift-vaults/ts/sdk" "" "true" "true"

install_and_build_package "." "@drift-labs/react @drift-labs/sdk @drift/common @drift-labs/icons @drift-labs/vaults-sdk" "" "true"


