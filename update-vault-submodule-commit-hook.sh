# This script is used as a pre-commit hook to update the submodule commit in the
# vaults-submodule-workaround.sh before commiting the branch.
# Currently, vercel deployment always pulls the master branch's latest commit of
# the submodule, hence we need to hardcode the commit in the workaround script
# if we want the repo to be deployed with a specfic drift-vaults commit.

# get the commit of the drift-vaults submodule
output=`git submodule status | grep drift-vaults | awk '{print $1}' | head -n 1` # get submodule info
echo "git submodule commit = $output"
no_prefix=${output#*[+-]} # get rid of the prefix
echo "no_prefix = $no_prefix"
COMMIT=${no_prefix} # get rid of the suffix

# update the commit in vaults-submodule-workaround.sh
echo "pwd"
pwd
echo "ls"
ls
echo "sed -i '' \"s/COMMIT='.*'/COMMIT='$COMMIT'/g\" ./vaults-submodule-workaround.sh"
sed -i '' "s/COMMIT='.*'/COMMIT='$COMMIT'/g" ./vaults-submodule-workaround.sh
echo "git add vaults-submodule-workaround.sh"
git add vaults-submodule-workaround.sh
