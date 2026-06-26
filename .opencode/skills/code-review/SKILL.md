---
name: code-review
description: Review code for security vulnerabilities, performance issues, and best practices
license: MIT
compatibility: opencode
---

## What I Do
- Analyze code changes for potential issues
- Check for security vulnerabilities
- Evaluate performance implications
- Suggest improvements

## Guidelines
1. Read the diff first, understand the change
2. Check for:
   - SQL injection / XSS / CSRF
   - Memory leaks
   - Error handling
   - Edge cases
3. Provide constructive, actionable feedback
4. Prioritize: Security > Correctness > Performance > Style

## Output Format
```
## Files Reviewed
- path/to/file.ts

## Findings
- [HIGH] SQL injection risk in line 42
- [MED] Missing input validation

## Summary
Overall assessment: ...
```
