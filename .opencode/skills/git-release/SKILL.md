---
name: git-release
description: Create consistent releases and changelogs with version bumps and GitHub releases
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do
- Draft release notes from merged PRs
- Propose a version bump (major/minor/patch)
- Provide a copy-pasteable `gh release create` command

## When to use me
Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.

## Steps
1. Run `git log --oneline --no-decorate v{last_tag}..HEAD` to list changes
2. Categorize into Features, Fixes, Maintenance
3. Propose version bump using semver
4. Generate `gh release create` command
