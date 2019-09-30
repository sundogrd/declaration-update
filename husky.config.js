const { join } = require('path');

const commitLintConfig = join(__dirname, 'commitlint.config.js');

module.exports = {
  hooks: {
    'commit-msg': `[[ -n $HUSKY_BYPASS ]] || commitlint -e $GIT_PARAMS --config ${commitLintConfig}`,
  },
};
