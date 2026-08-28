export default {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    // Ignore merge commits (GitHub merge buttons, git merge)
    (commit) =>
      commit.includes("Merge pull request") || commit.includes("Merge branch"),
    // Ignore commits authored by bots (dependabot, Copilot Autofix, etc.)
    (commit) =>
      commit.includes("Co-authored-by:") &&
      (commit.includes("[bot]") || commit.includes("dependabot")),
  ],
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
