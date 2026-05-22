# Install

The TypeScript SDK is published to **GitHub Packages** as `@opensubagents/outcomes-sdk`. (A future release will also push to npmjs.com — see `subagentceo/outcomes-orchestrator/tickets/TKT-005`.)

## One-time setup

Add this line to your project's `.npmrc` (or `~/.npmrc` for a global default):

```
@opensubagents:registry=https://npm.pkg.github.com
```

Then authenticate with a GitHub Personal Access Token that has the `read:packages` scope (no `repo` or `write` scopes needed for installs):

```sh
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

For CI, set `NPM_TOKEN=${{ secrets.GITHUB_TOKEN }}` in your workflow and `actions/setup-node` will configure auth automatically.

## Install

```sh
npm install @opensubagents/outcomes-sdk
# or
pnpm add @opensubagents/outcomes-sdk
# or
bun add @opensubagents/outcomes-sdk
```

## Use

```ts
import { HeuristicVerifier, Confidence, SourceKind } from "@opensubagents/outcomes-sdk";

const verifier = new HeuristicVerifier();
const verdict = verifier.verify(outcome, report);
console.log(verdict.overall); // → 1.0..5.0
```

See the [main README](./README.md) for the full quickstart.
