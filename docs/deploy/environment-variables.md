---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Nextstep uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `NEXTSTEP_BIND` | `loopback` | Reachability preset: `loopback`, `lan`, `tailnet`, or `custom` |
| `NEXTSTEP_BIND_HOST` | (unset) | Required when `NEXTSTEP_BIND=custom` |
| `HOST` | `127.0.0.1` | Legacy host override; prefer `NEXTSTEP_BIND` for new setups |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `NEXTSTEP_HOME` | `~/.Nextstep` | Base directory for all Nextstep data |
| `NEXTSTEP_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `NEXTSTEP_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |
| `NEXTSTEP_DEPLOYMENT_EXPOSURE` | `private` | Exposure policy when deployment mode is `authenticated` |
| `NEXTSTEP_API_URL` | (auto-derived) | Nextstep API base URL. When set externally (e.g., via Kubernetes ConfigMap, load balancer, or reverse proxy), the server preserves the value instead of deriving it from the listen host and port. Useful for deployments where the public-facing URL differs from the local bind address. |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXTSTEP_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `NEXTSTEP_SECRETS_MASTER_KEY_FILE` | `~/.nextstep/.../secrets/master.key` | Path to key file |
| `NEXTSTEP_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `NEXTSTEP_AGENT_ID` | Agent's unique ID |
| `NEXTSTEP_COMPANY_ID` | Company ID |
| `NEXTSTEP_API_URL` | Nextstep API base URL (inherits the server-level value; see Server Configuration above) |
| `NEXTSTEP_API_KEY` | Short-lived JWT for API auth |
| `NEXTSTEP_RUN_ID` | Current heartbeat run ID |
| `NEXTSTEP_TASK_ID` | Issue that triggered this wake |
| `NEXTSTEP_WAKE_REASON` | Wake trigger reason |
| `NEXTSTEP_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `NEXTSTEP_APPROVAL_ID` | Resolved approval ID |
| `NEXTSTEP_APPROVAL_STATUS` | Approval decision |
| `NEXTSTEP_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
