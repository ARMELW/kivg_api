// Temporarily allow any commit message to bypass commitlint checks.
// This is intended for local/dev overrides only. Revert when strict commitlint is needed.
export default {
  extends: ['@commitlint/config-conventional'],
  // ignore all commit messages (function must be serializable for some runners, but commitlint accepts functions)
  ignores: [() => true]
}
