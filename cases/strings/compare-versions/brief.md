Write a JavaScript function compareVersions(a, b) that orders two version strings by Semantic Versioning 2.0.0 precedence. Return -1 when a comes before b, 1 when a comes after b, and 0 when they have equal precedence.

Both arguments are valid SemVer 2.0.0 versions, such as "1.4.2", "2.0.0-rc.1" or "1.0.0-beta+exp.sha.5114f85", so the function does not need to validate them. Every numeric part has at most 15 digits.

Precedence rules:
- Compare major, minor and patch as numbers, in that order: "1.10.0" comes after "1.9.0".
- When those are equal, a version with a pre-release comes before the same version without one: "1.0.0-alpha" comes before "1.0.0".
- Two pre-releases are compared one dot-separated identifier at a time, left to right. Identifiers made only of digits are compared as numbers: "1.0.0-alpha.10" comes after "1.0.0-alpha.9". Other identifiers are compared character by character in ASCII order. A numeric identifier comes before a non-numeric one: "1.0.0-1" comes before "1.0.0-alpha". When every identifier is equal up to the end of the shorter list, the longer list comes after: "1.0.0-alpha" comes before "1.0.0-alpha.1".
- Pre-release identifiers may contain hyphens, as in "1.0.0-x-y".
- Build metadata, everything after a "+", is ignored: "1.0.0+build.1" and "1.0.0+build.2" are equal. Build metadata may also contain hyphens.

Deliver the function at top level in one fenced javascript code block, without imports or exports, using only standard JavaScript built-ins.
