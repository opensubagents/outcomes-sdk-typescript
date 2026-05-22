# @opensubagents/outcomes-sdk

TypeScript SDK for the [Open Outcome](https://github.com/opensubagents/outcomes) specification — declare outcomes, verify reports, grade results.

[![status: experimental](https://img.shields.io/static/v1?label=Status&message=experimental&color=orange)](https://github.com/opensubagents/outcomes/blob/main/MATURITY.md)
[![spec: v0.1.0](https://img.shields.io/static/v1?label=Spec&message=v0.1.0&color=blue)](https://github.com/opensubagents/outcomes)
[![npm](https://img.shields.io/npm/v/@opensubagents/outcomes-sdk.svg)](https://www.npmjs.com/package/@opensubagents/outcomes-sdk)

## Install

Published to **GitHub Packages**. One-time `.npmrc` config:

```
@opensubagents:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then:

```sh
npm install @opensubagents/outcomes-sdk
# or
pnpm add @opensubagents/outcomes-sdk
# or
bun add @opensubagents/outcomes-sdk
```

See [INSTALL.md](./INSTALL.md) for full setup details. (A future release will also publish to npmjs.com.)

## Quickstart

```ts
import {
  OutcomeDeclaration,
  HeuristicVerifier,
  Confidence,
  SourceKind,
  verdictToSpanAttributes,
} from "@opensubagents/outcomes-sdk";

const outcome: OutcomeDeclaration = {
  title: "Will the deploy be reproducible?",
  as_of: "2026-05-21",
  question: "Does the build produce byte-identical artifacts from the same source?",
  success_criteria: ["A hash comparison is performed", "Any drift is explained"],
};

const report = {
  summary: "The build is reproducible. The CI hash matches the local hash.",
  claims: [
    {
      statement: "The CI artifact hash equals the local artifact hash.",
      confidence: Confidence.HIGH,
      citations: [
        { url: "https://example.com/ci/run/1234", title: "CI run #1234", accessed: "2026-05-21", kind: SourceKind.PRIMARY },
        { url: "https://example.com/local-build-log", title: "Local build log", accessed: "2026-05-21", kind: SourceKind.PRIMARY },
      ],
    },
  ],
};

const verdict = new HeuristicVerifier().verify(outcome, report);
console.log(verdict.overall);
console.log(verdictToSpanAttributes(verdict));
```

## Parity with the Python SDK

This SDK implements the **same `HeuristicVerifier` algorithm** as the [Python `open-outcome` package](https://github.com/opensubagents/outcomes-sdk-python). Each SDK's test suite includes shared fixtures so both implementations produce equal verdicts on the same input.

## Layout

```
outcomes-sdk-typescript/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── outcome.ts
│   ├── evidence.ts
│   ├── report.ts
│   ├── verdict.ts
│   ├── verifier.ts
│   ├── otel.ts
│   └── conformance.ts
├── schemas/                # bundled spec schemas
└── test/
    ├── outcome.test.ts
    ├── verifier.test.ts
    ├── otel.test.ts
    └── conformance.test.ts
```

## Repos in the suite

- **Spec:** [`opensubagents/outcomes`](https://github.com/opensubagents/outcomes) — Open Outcome specification, JSON Schema, glossary
- **TypeScript SDK (this repo):** [`opensubagents/outcomes-sdk-typescript`](https://github.com/opensubagents/outcomes-sdk-typescript) → `@opensubagents/outcomes-sdk` on npm
- **Python SDK:** [`opensubagents/outcomes-sdk-python`](https://github.com/opensubagents/outcomes-sdk-python) → `open-outcome` on PyPI
- **MCP server:** [`opensubagents/outcomes-mcp`](https://github.com/opensubagents/outcomes-mcp)

## License

Apache-2.0
