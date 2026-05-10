# Nextstep MCP Server

Model Context Protocol server for Nextstep.

This package is a thin MCP wrapper over the existing Nextstep REST API. It does
not talk to the database directly and it does not reimplement business logic.

## Authentication

The server reads its configuration from environment variables:

- `NEXTSTEP_API_URL` - Nextstep base URL, for example `http://localhost:3100`
- `NEXTSTEP_API_KEY` - bearer token used for `/api` requests
- `NEXTSTEP_COMPANY_ID` - optional default company for company-scoped tools
- `NEXTSTEP_AGENT_ID` - optional default agent for checkout helpers
- `NEXTSTEP_RUN_ID` - optional run id forwarded on mutating requests

## Usage

```sh
npx -y @nextstepai/mcp-server
```

Or locally in this repo:

```sh
pnpm --filter @nextstepai/mcp-server build
node packages/mcp-server/dist/stdio.js
```

## Tool Surface

Read tools:

- `NextstepMe`
- `NextstepInboxLite`
- `NextstepListAgents`
- `NextstepGetAgent`
- `NextstepListIssues`
- `NextstepGetIssue`
- `NextstepGetHeartbeatContext`
- `NextstepListComments`
- `NextstepGetComment`
- `NextstepListIssueApprovals`
- `NextstepListDocuments`
- `NextstepGetDocument`
- `NextstepListDocumentRevisions`
- `NextstepListProjects`
- `NextstepGetProject`
- `NextstepGetIssueWorkspaceRuntime`
- `NextstepWaitForIssueWorkspaceService`
- `NextstepListGoals`
- `NextstepGetGoal`
- `NextstepListApprovals`
- `NextstepGetApproval`
- `NextstepGetApprovalIssues`
- `NextstepListApprovalComments`

Write tools:

- `NextstepCreateIssue`
- `NextstepUpdateIssue`
- `NextstepCheckoutIssue`
- `NextstepReleaseIssue`
- `NextstepAddComment`
- `NextstepSuggestTasks`
- `NextstepAskUserQuestions`
- `NextstepRequestConfirmation`
- `NextstepUpsertIssueDocument`
- `NextstepRestoreIssueDocumentRevision`
- `NextstepControlIssueWorkspaceServices`
- `NextstepCreateApproval`
- `NextstepLinkIssueApproval`
- `NextstepUnlinkIssueApproval`
- `NextstepApprovalDecision`
- `NextstepAddApprovalComment`

Escape hatch:

- `NextstepApiRequest`

`NextstepApiRequest` is limited to paths under `/api` and JSON bodies. It is
meant for endpoints that do not yet have a dedicated MCP tool.
