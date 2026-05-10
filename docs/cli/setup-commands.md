---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `nextstepai run`

One-command bootstrap and start:

```sh
pnpm nextstepai run
```

Does:

1. Auto-onboards if config is missing
2. Runs `nextstepai doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm nextstepai run --instance dev
```

## `nextstepai onboard`

Interactive first-time setup:

```sh
pnpm nextstepai onboard
```

If Nextstep is already configured, rerunning `onboard` keeps the existing config in place. Use `nextstepai configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm nextstepai onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm nextstepai onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts Nextstep with that setup.

## `nextstepai doctor`

Health checks with optional auto-repair:

```sh
pnpm nextstepai doctor
pnpm nextstepai doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `nextstepai configure`

Update configuration sections:

```sh
pnpm nextstepai configure --section server
pnpm nextstepai configure --section secrets
pnpm nextstepai configure --section storage
```

## `nextstepai env`

Show resolved environment configuration:

```sh
pnpm nextstepai env
```

This now includes bind-oriented deployment settings such as `NEXTSTEP_BIND` and `NEXTSTEP_BIND_HOST` when configured.

## `nextstepai allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm nextstepai allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.nextstep/instances/default/config.json` |
| Database | `~/.nextstep/instances/default/db` |
| Logs | `~/.nextstep/instances/default/logs` |
| Storage | `~/.nextstep/instances/default/data/storage` |
| Secrets key | `~/.nextstep/instances/default/secrets/master.key` |

Override with:

```sh
NEXTSTEP_HOME=/custom/home NEXTSTEP_INSTANCE_ID=dev pnpm nextstepai run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm nextstepai run --data-dir ./tmp/nextstep-dev
pnpm nextstepai doctor --data-dir ./tmp/nextstep-dev
```
