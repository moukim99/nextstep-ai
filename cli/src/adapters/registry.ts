import type { CLIAdapterModule } from "@nextstepai/adapter-utils";
import { printAcpxStreamEvent } from "@nextstepai/adapter-acpx-local/cli";
import { printClaudeStreamEvent } from "@nextstepai/adapter-claude-local/cli";
import { printCodexStreamEvent } from "@nextstepai/adapter-codex-local/cli";
import { printCursorStreamEvent } from "@nextstepai/adapter-cursor-local/cli";
import { printGeminiStreamEvent } from "@nextstepai/adapter-gemini-local/cli";
import { printOpenCodeStreamEvent } from "@nextstepai/adapter-opencode-local/cli";
import { printPiStreamEvent } from "@nextstepai/adapter-pi-local/cli";
import { printOpenClawGatewayStreamEvent } from "@nextstepai/adapter-openclaw-gateway/cli";
import { processCLIAdapter } from "./process/index.js";
import { httpCLIAdapter } from "./http/index.js";

const claudeLocalCLIAdapter: CLIAdapterModule = {
  type: "claude_local",
  formatStdoutEvent: printClaudeStreamEvent,
};

const acpxLocalCLIAdapter: CLIAdapterModule = {
  type: "acpx_local",
  formatStdoutEvent: printAcpxStreamEvent,
};

const codexLocalCLIAdapter: CLIAdapterModule = {
  type: "codex_local",
  formatStdoutEvent: printCodexStreamEvent,
};

const openCodeLocalCLIAdapter: CLIAdapterModule = {
  type: "opencode_local",
  formatStdoutEvent: printOpenCodeStreamEvent,
};

const piLocalCLIAdapter: CLIAdapterModule = {
  type: "pi_local",
  formatStdoutEvent: printPiStreamEvent,
};

const cursorLocalCLIAdapter: CLIAdapterModule = {
  type: "cursor",
  formatStdoutEvent: printCursorStreamEvent,
};

const geminiLocalCLIAdapter: CLIAdapterModule = {
  type: "gemini_local",
  formatStdoutEvent: printGeminiStreamEvent,
};

const openclawGatewayCLIAdapter: CLIAdapterModule = {
  type: "openclaw_gateway",
  formatStdoutEvent: printOpenClawGatewayStreamEvent,
};

const adaptersByType = new Map<string, CLIAdapterModule>(
  [
    acpxLocalCLIAdapter,
    claudeLocalCLIAdapter,
    codexLocalCLIAdapter,
    openCodeLocalCLIAdapter,
    piLocalCLIAdapter,
    cursorLocalCLIAdapter,
    geminiLocalCLIAdapter,
    openclawGatewayCLIAdapter,
    processCLIAdapter,
    httpCLIAdapter,
  ].map((a) => [a.type, a]),
);

export function getCLIAdapter(type: string): CLIAdapterModule {
  return adaptersByType.get(type) ?? processCLIAdapter;
}
