export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "docs",
        "chore",
        "test",
        "ci",
        "perf",
        "style",
        "revert",
      ],
    ],
    "subject-case": [0],
    "body-max-line-length": [0],
    "header-max-length": [0],
  },
};
