# CLI Reference

Nextstep CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`, `env-lab`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm nextstepai --help
```

First-time local bootstrap + run:

```sh
pnpm nextstepai run
```

Choose local instance:

```sh
pnpm nextstepai run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `nextstepai onboard` and `nextstepai configure --section server` set deployment mode in config
- server onboarding/configure ask for reachability intent and write `server.bind`
- `nextstepai run --bind <loopback|lan|tailnet>` passes a quickstart bind preset into first-run onboarding when config is missing
- runtime can override mode with `NEXTSTEP_DEPLOYMENT_MODE`
- `nextstepai run` and `nextstepai doctor` still do not expose a direct low-level `--mode` flag

Canonical behavior is documented in `doc/DEPLOYMENT-MODES.md`.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm nextstepai allowed-hostname dotta-macbook-pro
```

Bring up the default local SSH fixture for environment testing:

```sh
pnpm nextstepai env-lab up
pnpm nextstepai env-lab doctor
pnpm nextstepai env-lab status --json
pnpm nextstepai env-lab down
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.Nextstep`:

```sh
pnpm nextstepai run --data-dir ./tmp/nextstep-dev
pnpm nextstepai issue list --data-dir ./tmp/nextstep-dev
```

## Context Profiles

Store local defaults in `~/.nextstep/context.json`:

```sh
pnpm nextstepai context set --api-base http://localhost:3100 --company-id <company-id>
pnpm nextstepai context show
pnpm nextstepai context list
pnpm nextstepai context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm nextstepai context set --api-key-env-var-name NEXTSTEP_API_KEY
export NEXTSTEP_API_KEY=...
```

## Company Commands

```sh
pnpm nextstepai company list
pnpm nextstepai company get <company-id>
pnpm nextstepai company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm nextstepai company delete PAP --yes --confirm PAP
pnpm nextstepai company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `NEXTSTEP_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `NEXTSTEP_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm nextstepai issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm nextstepai issue get <issue-id-or-identifier>
pnpm nextstepai issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm nextstepai issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm nextstepai issue comment <issue-id> --body "..." [--reopen]
pnpm nextstepai issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm nextstepai issue release <issue-id>
```

## Agent Commands

```sh
pnpm nextstepai agent list --company-id <company-id>
pnpm nextstepai agent get <agent-id>
pnpm nextstepai agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Nextstep agent:

- creates a new long-lived agent API key
- installs missing Nextstep skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `NEXTSTEP_API_URL`, `NEXTSTEP_COMPANY_ID`, `NEXTSTEP_AGENT_ID`, and `NEXTSTEP_API_KEY`

Example for shortname-based local setup:

```sh
pnpm nextstepai agent local-cli codexcoder --company-id <company-id>
pnpm nextstepai agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm nextstepai approval list --company-id <company-id> [--status pending]
pnpm nextstepai approval get <approval-id>
pnpm nextstepai approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm nextstepai approval approve <approval-id> [--decision-note "..."]
pnpm nextstepai approval reject <approval-id> [--decision-note "..."]
pnpm nextstepai approval request-revision <approval-id> [--decision-note "..."]
pnpm nextstepai approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm nextstepai approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm nextstepai activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm nextstepai dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm nextstepai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.nextstep/instances/default`:

- config: `~/.nextstep/instances/default/config.json`
- embedded db: `~/.nextstep/instances/default/db`
- logs: `~/.nextstep/instances/default/logs`
- storage: `~/.nextstep/instances/default/data/storage`
- secrets key: `~/.nextstep/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
NEXTSTEP_HOME=/custom/home NEXTSTEP_INSTANCE_ID=dev pnpm nextstepai run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm nextstepai configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
