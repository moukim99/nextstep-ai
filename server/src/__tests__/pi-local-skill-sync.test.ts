import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listPiSkills,
  syncPiSkills,
} from "@nextstepai/adapter-pi-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("pi local skill sync", () => {
  const NextstepKey = "nextstepai/nextstep/Nextstep";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Nextstep skills and installs them into the Pi skills home", async () => {
    const home = await makeTempDir("Nextstep-pi-skill-sync-");
    cleanupDirs.add(home);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "pi_local",
      config: {
        env: {
          HOME: home,
        },
        NextstepSkillSync: {
          desiredSkills: [NextstepKey],
        },
      },
    } as const;

    const before = await listPiSkills(ctx);
    expect(before.mode).toBe("persistent");
    expect(before.desiredSkills).toContain(NextstepKey);
    expect(before.entries.find((entry) => entry.key === NextstepKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("missing");

    const after = await syncPiSkills(ctx, [NextstepKey]);
    expect(after.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".pi", "agent", "skills", "Nextstep"))).isSymbolicLink()).toBe(true);
  });

  it("keeps required bundled Nextstep skills installed even when the desired set is emptied", async () => {
    const home = await makeTempDir("Nextstep-pi-skill-prune-");
    cleanupDirs.add(home);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "pi_local",
      config: {
        env: {
          HOME: home,
        },
        NextstepSkillSync: {
          desiredSkills: [NextstepKey],
        },
      },
    } as const;

    await syncPiSkills(configuredCtx, [NextstepKey]);

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

    const after = await syncPiSkills(clearedCtx, []);
    expect(after.desiredSkills).toContain(NextstepKey);
    expect(after.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("installed");
    expect((await fs.lstat(path.join(home, ".pi", "agent", "skills", "Nextstep"))).isSymbolicLink()).toBe(true);
  });
});
