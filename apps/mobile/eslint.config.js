const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      '.expo/*',
      'coverage/*',
      'jest.setup.js',
      'scripts/*',
    ],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "MemberExpression[object.name=/^(err|error|caught)$/][property.name='message']",
          message:
            'Avoid raw err.message in UI — route through mapUserFacingError or a feature mapper.',
        },
        {
          selector:
            "OptionalMemberExpression[object.name='error'][property.name='message']",
          message:
            'Avoid raw error?.message in UI — route through mapUserFacingError or a feature mapper.',
        },
      ],
    },
  },
]);
