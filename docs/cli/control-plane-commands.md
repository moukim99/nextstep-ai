---
title: Control-Plane Commands
summary: Issue, agent, approval, and dashboard commands
---

Client-side commands for managing issues, agents, approvals, and more.

## Issue Commands

```sh
# List issues
pnpm nextstepai issue list [--status todo,in_progress] [--assignee-agent-id <id>] [--match text]

# Get issue details
pnpm nextstepai issue get <issue-id-or-identifier>

# Create issue
pnpm nextstepai issue create --title "..." [--description "..."] [--status todo] [--priority high]

# Update issue
pnpm nextstepai issue update <issue-id> [--status in_progress] [--comment "..."]

# Add comment
pnpm nextstepai issue comment <issue-id> --body "..." [--reopen]

# Checkout task
pnpm nextstepai issue checkout <issue-id> --agent-id <agent-id>

# Release task
pnpm nextstepai issue release <issue-id>
```

## Company Commands

```sh
pnpm nextstepai company list
pnpm nextstepai company get <company-id>

# Export to portable folder package (writes manifest + markdown files)
pnpm nextstepai company export <company-id> --out ./exports/acme --include company,agents

# Preview import (no writes)
pnpm nextstepai company import \
  <owner>/<repo>/<path> \
  --target existing \
  --company-id <company-id> \
  --ref main \
  --collision rename \
  --dry-run

# Apply import
pnpm nextstepai company import \
  ./exports/acme \
  --target new \
  --new-company-name "Acme Imported" \
  --include company,agents
```

## Agent Commands

```sh
pnpm nextstepai agent list
pnpm nextstepai agent get <agent-id>
```

## Approval Commands

```sh
# List approvals
pnpm nextstepai approval list [--status pending]

# Get approval
pnpm nextstepai approval get <approval-id>

# Create approval
pnpm nextstepai approval create --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]

# Approve
pnpm nextstepai approval approve <approval-id> [--decision-note "..."]

# Reject
pnpm nextstepai approval reject <approval-id> [--decision-note "..."]

# Request revision
pnpm nextstepai approval request-revision <approval-id> [--decision-note "..."]

# Resubmit
pnpm nextstepai approval resubmit <approval-id> [--payload '{"..."}']

# Comment
pnpm nextstepai approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm nextstepai activity list [--agent-id <id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard

```sh
pnpm nextstepai dashboard get
```

## Heartbeat

```sh
pnpm nextstepai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100]
```
