git submodule update --init
cd drift-common
git submodule update --init
cd protocol
git checkout master
cd ..
git checkout master
cd ../drift-vaults
git checkout master
cd ..

sh ./build_all_sm.sh