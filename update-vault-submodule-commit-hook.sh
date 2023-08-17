# This script is used as a pre-commit hook to update the submodule commit in the
# vaults-submodule-workaround.sh before commiting the branch.
# Currently, vercel deployment always pulls the master branch's latest commit of
# the submodule, hence we need to hardcode the commit in the workaround script
# if we want the repo to be deployed with a specfic drift-vaults commit.

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# get the commit of the drift-vaults submodule
output=`git submodule status | grep drift-vaults | awk '{print $1}' | head -n 1` # get submodule info
echo "git submodule commit = $output"
no_prefix=${output#*[+-]} # get rid of the prefix
echo "no_prefix = $no_prefix"
COMMIT=${no_prefix} # get rid of the suffix

# get current commit of the drift-vaults submodule in the workaround script
current_commit=$(grep -oE '[0-9a-f]{40}' vaults-submodule-workaround.sh)
echo "current_commit = $current_commit"

# if current_commit and COMMIT is same, exit
if [ "$current_commit" = "$COMMIT" ]; then
  echo "${GREEN}current_commit and COMMIT is same, exit${NC}"
  exit 0
fi

# print out in yellow that the commit is being updated
echo "${YELLOW}******************************************************${NC}"
echo "${YELLOW}Updating the commit in vaults-submodule-workaround.sh to:${NC}"
echo "${YELLOW}'$COMMIT'${NC}"
echo "${YELLOW}******************************************************${NC}"

# update the commit in vaults-submodule-workaround.sh
echo "sed -i '' \"s/COMMIT='.*'/COMMIT='$COMMIT'/g\" ./vaults-submodule-workaround.sh"
sed -i '' "s/COMMIT='.*'/COMMIT='$COMMIT'/g" ./vaults-submodule-workaround.sh
echo "git add vaults-submodule-workaround.sh"
git add vaults-submodule-workaround.sh
