# Security policy

## Reporting a vulnerability

Please report a vulnerability **privately**. Do not open a public issue or pull request for it.

- Preferred: [report it on GitHub](https://github.com/QTSurfer/indicators-pro-ts/security/advisories/new) (the
  repository's Security tab, "Report a vulnerability"). Only you and the maintainers see the report.
- Or by e-mail to <security@wualabs.com>.

Include what you found, the package and version, and how to reproduce it (a small program or test is best). We
acknowledge reports, tell you what we decide, and credit you in the release notes if you wish. We ask you to give
us time to publish a fix before you disclose the problem.

## Supported versions

Only the latest release of `@qtsurfer/indicators-pro` gets fixes. The package is `0.x`: upgrade to the latest
release before you report.

## Scope

This is a library that runs in your process (a browser or Node.js). A report is in scope when the package, as
published to npm, can be made to run code it should not, to read or write data it should not, or to stop
responding, from input a well-behaved application would pass to it. A defect in how your application uses the
library, or in a strategy that you wrote, is not.
