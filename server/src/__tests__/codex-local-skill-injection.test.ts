import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@nextstepai/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createNextstepRepoSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "adapter-utils"), { recursive: true });
  await fs.mkdir(path.join(root, "skills", skillName), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), '{"name":"Nextstep"}\n', "utf8");
  await fs.writeFile(
    path.join(root, "skills", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

async function createCustomSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "custom", skillName), { recursive: true });
  await fs.writeFile(
    path.join(root, "custom", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

describe("codex local adapter skill injection", () => {
  const NextstepKey = "nextstepai/nextstep/Nextstep";
  const createAgentKey = "nextstepai/nextstep/Nextstep-create-agent";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("repairs a Codex Nextstep skill symlink that still points at another live checkout", async () => {
    const currentRepo = await makeTempDir("Nextstep-codex-current-");
    const oldRepo = await makeTempDir("Nextstep-codex-old-");
    const skillsHome = await makeTempDir("Nextstep-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createNextstepRepoSkill(currentRepo, "Nextstep");
    await createNextstepRepoSkill(currentRepo, "Nextstep-create-agent");
    await createNextstepRepoSkill(oldRepo, "Nextstep");
    await fs.symlink(path.join(oldRepo, "skills", "Nextstep"), path.join(skillsHome, "Nextstep"));

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    await ensureCodexSkillsInjected(
      async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
      {
        skillsHome,
        skillsEntries: [
          {
            key: NextstepKey,
            runtimeName: "Nextstep",
            source: path.join(currentRepo, "skills", "Nextstep"),
          },
          {
            key: createAgentKey,
            runtimeName: "Nextstep-create-agent",
            source: path.join(currentRepo, "skills", "Nextstep-create-agent"),
          },
        ],
      },
    );

    expect(await fs.realpath(path.join(skillsHome, "Nextstep"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "Nextstep")),
    );
    expect(await fs.realpath(path.join(skillsHome, "Nextstep-create-agent"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "Nextstep-create-agent")),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Repaired Codex skill "Nextstep"'),
      }),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Injected Codex skill "Nextstep-create-agent"'),
      }),
    );
  });

  it("preserves a custom Codex skill symlink outside Nextstep repo checkouts", async () => {
    const currentRepo = await makeTempDir("Nextstep-codex-current-");
    const customRoot = await makeTempDir("Nextstep-codex-custom-");
    const skillsHome = await makeTempDir("Nextstep-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(customRoot);
    cleanupDirs.add(skillsHome);

    await createNextstepRepoSkill(currentRepo, "Nextstep");
    await createCustomSkill(customRoot, "Nextstep");
    await fs.symlink(path.join(customRoot, "custom", "Nextstep"), path.join(skillsHome, "Nextstep"));

    await ensureCodexSkillsInjected(async () => {}, {
      skillsHome,
      skillsEntries: [{
        key: NextstepKey,
        runtimeName: "Nextstep",
        source: path.join(currentRepo, "skills", "Nextstep"),
      }],
    });

    expect(await fs.realpath(path.join(skillsHome, "Nextstep"))).toBe(
      await fs.realpath(path.join(customRoot, "custom", "Nextstep")),
    );
  });

  it("prunes broken symlinks for unavailable Nextstep repo skills before Codex starts", async () => {
    const currentRepo = await makeTempDir("Nextstep-codex-current-");
    const oldRepo = await makeTempDir("Nextstep-codex-old-");
    const skillsHome = await makeTempDir("Nextstep-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createNextstepRepoSkill(currentRepo, "Nextstep");
    await createNextstepRepoSkill(oldRepo, "agent-browser");
    const staleTarget = path.join(oldRepo, "skills", "agent-browser");
    await fs.symlink(staleTarget, path.join(skillsHome, "agent-browser"));
    await fs.rm(staleTarget, { recursive: true, force: true });

    const logs: Array<{ stream: "stdout" | "stderr"; chunk: string }> = [];
    await ensureCodexSkillsInjected(
      async (stream, chunk) => {
        logs.push({ stream, chunk });
      },
      {
        skillsHome,
        skillsEntries: [{
          key: NextstepKey,
          runtimeName: "Nextstep",
          source: path.join(currentRepo, "skills", "Nextstep"),
        }],
      },
    );

    await expect(fs.lstat(path.join(skillsHome, "agent-browser"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(logs).toContainEqual(
      expect.objectContaining({
        stream: "stdout",
        chunk: expect.stringContaining('Removed stale Codex skill "agent-browser"'),
      }),
    );
  });

  it("preserves other live Nextstep skill symlinks in the shared workspace skill directory", async () => {
    const currentRepo = await makeTempDir("Nextstep-codex-current-");
    const skillsHome = await makeTempDir("Nextstep-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(skillsHome);

    await createNextstepRepoSkill(currentRepo, "Nextstep");
    await createNextstepRepoSkill(currentRepo, "agent-browser");
    await fs.symlink(
      path.join(currentRepo, "skills", "agent-browser"),
      path.join(skillsHome, "agent-browser"),
    );

    await ensureCodexSkillsInjected(async () => {}, {
      skillsHome,
      skillsEntries: [{
        key: NextstepKey,
        runtimeName: "Nextstep",
        source: path.join(currentRepo, "skills", "Nextstep"),
      }],
    });

    expect((await fs.lstat(path.join(skillsHome, "Nextstep"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(skillsHome, "agent-browser"))).isSymbolicLink()).toBe(true);
    expect(await fs.realpath(path.join(skillsHome, "agent-browser"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "agent-browser")),
    );
  });
});
