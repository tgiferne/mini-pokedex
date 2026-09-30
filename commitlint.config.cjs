module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-case": [2, "always", "kebab-case"],
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
  },
};
