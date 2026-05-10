import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listOpenCodeSkills,
  syncOpenCodeSkills,
} from "@nextstepai/adapter-opencode-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("opencode local skill sync", () => {
  const NextstepKey = "nextstepai/nextstep/Nextstep";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Nextstep skills and installs them into the shared Claude/OpenCode skills home", async () => {
    const home = await makeTempDir("Nextstep-opencode-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "opencode_local",
      config: {
        env: {
          HOME: home,
        },
        NextstepSkillSync: {
          desiredSkills: [NextstepKey],
        },
      },
    } as const;

    const before = await listOpenCodeSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.warnings).toContain("OpenCode currently uses the shared Claude skills home (~/.claude/skills).");
    expect(before.desiredSkills).toContain(NextstepKey);
    expect(before.entries.find((entry) => entry.key === NextstepKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("missing");

    const after = await syncOpenCodeSkills(ctx, [NextstepKey]);
    expect(after.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".claude", "skills", "Nextstep"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Nextstep skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("Nextstep-opencode-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "opencode_local",
      config: {
        env: {
          HOME: home,
        },
        NextstepSkillSync: {
          desiredSkills: [NextstepKey],
        },
      },
    } as const;

    await syncOpenCodeSkills(configuredCtx, [NextstepKey]);

    const clearedCtx = {
      ...configuredCtx,
      config: {
        env: {
          HOME: home,
        },
        NextstepSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncOpenCodeSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(NextstepKey);
    expect(after.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".claude", "skills", "Nextstep"))).isSymbolicLink()).toBe(true);
  });
});
