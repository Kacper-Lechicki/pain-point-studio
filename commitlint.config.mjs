const Configuration = {
  // Extend the conventional commit specification (e.g., feat, fix, docs)
  extends: ['@commitlint/config-conventional'],
  // Custom rules for commit message validation
  rules: {
    // Restrict the allowed commit types to a specific list
    'type-enum': [2, 'always', ['feat', 'test', 'setup', 'docs', 'fix']],
  },
};

export default Configuration;
