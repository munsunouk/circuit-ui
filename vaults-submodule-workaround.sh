# This script works around vercel limitations to pull the common submodule from github so that it can be installed during the build process.

# The logic is as follows:
# - Get a ref to the common repo
# - Get the latest commit from the common submodule in the current repo
# - Create a tmp folder and pull the common submodule's code into it, from the target commit
# - Pull the protocol submodule aswell
# - Move the manually pulled code into the target submodule directory

# github submodule repo address without https:// prefix
SUBMODULE_GITHUB=github.com/drift-labs/drift-vaults

# .gitmodules submodule path
SUBMODULE_PATH=drift-vaults

# github access token is necessary
# add it to Environment Variables on Vercel
if [ "$GITHUB_ACCESS_TOKEN" == "" ]; then
  echo "Error: GITHUB_ACCESS_TOKEN is empty"
  exit 1
fi

# stop execution on error - don't let it build if something goes wrong
set -e

# get submodule commit - either get commit from current branch or hardcode the commit. 
# vercel deployment has some issue whereby it always takes the commit from master branch,
# hence we hardcode the commit instead

output=`git submodule status | grep drift-vaults | awk '{print $1}' | head -n 1` # get submodule info
echo "git submodule commit = $output"
no_prefix=${output#*[+-]} # get rid of the prefix
echo "no_prefix = $no_prefix"
COMMIT=${no_prefix} # get rid of the suffix

# COMMIT='c717124e28adb9e1f0ea3e4894b6bca35100218a'

echo "TRYING TO USE SUBMODULE COMMIT: $COMMIT"

# set up an empty temporary work directory
rm -rf tmp || true # remove the tmp folder if exists
mkdir tmp # create the tmp folder
cd tmp # go into the tmp folder

echo "Constructed tmp folder"

# checkout the current submodule commit
echo "git init"
git init # initialise empty repo
echo "git remote add origin https://$GITHUB_ACCESS_TOKEN@$SUBMODULE_GITHUB"
git remote add origin https://$GITHUB_ACCESS_TOKEN@$SUBMODULE_GITHUB # add origin of the submodule
echo "git fetch --depth=1 origin $COMMIT"
git fetch --depth=1 origin $COMMIT # fetch only the required version
echo "git checkout $COMMIT"
git checkout $COMMIT # checkout on the right commit

echo "moving UP"
# move the submodule from tmp to the submodule path
cd .. # go folder up
echo "clearing tmp/.git"
rm -rf tmp/.git # remove .git 
echo "Creating $SUBMODULE_PATH if required"
mkdir -p $SUBMODULE_PATH
echo "clearing $SUBMODULE_PATH/*"
rm -rf $SUBMODULE_PATH/*
echo "moving tmp into $SUBMODULE_PATH"
mv tmp/* $SUBMODULE_PATH/ # move the submodule to the submodule path

# # clean up
rm -rf tmp # remove the tmp folder