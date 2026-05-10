import { describe, expect, it } from "vitest";
import {
  listAcpxSkills,
  syncAcpxSkills,
} from "@nextstepai/adapter-acpx-local/server";

describe("acpx local skill sync", () => {
  const NextstepKey = "nextstepai/nextstep/Nextstep";
  const createAgentKey = "nextstepai/nextstep/Nextstep-create-agent";

  it("reports ACPX Claude skills as supported runtime-mounted state", async () => {
    const snapshot = await listAcpxSkills({
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "acpx_local",
      config: {
        agent: "claude",
        NextstepSkillSync: {
          desiredSkills: [NextstepKey],
        },
      },
    });

    expect(snapshot.adapterType).toBe("acpx_local");
    expect(snapshot.supported).toBe(true);
    expect(snapshot.mode).toBe("ephemeral");
    expect(snapshot.desiredSkills).toContain(NextstepKey);
    expect(snapshot.desiredSkills).toContain(createAgentKey);
    expect(snapshot.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === NextstepKey)?.detail).toContain("ACPX Claude session");
    expect(snapshot.warnings).toEqual([]);
  });

  it("reports ACPX Codex skills with Codex home runtime detail", async () => {
    const snapshot = await syncAcpxSkills({
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "acpx_local",
      config: {
        agent: "codex",
        NextstepSkillSync: {
          desiredSkills: ["Nextstep"],
        },
      },
    }, ["Nextstep"]);

    expect(snapshot.supported).toBe(true);
    expect(snapshot.mode).toBe("ephemeral");
    expect(snapshot.desiredSkills).toContain(NextstepKey);
    expect(snapshot.desiredSkills).not.toContain("Nextstep");
    expect(snapshot.entries.find((entry) => entry.key === NextstepKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === NextstepKey)?.detail).toContain("CODEX_HOME/skills/");
    expect(snapshot.warnings).toEqual([]);
  });

  it("keeps ACPX custom skill selection tracked but unsupported", async () => {
    const snapshot = await listAcpxSkills({
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "acpx_local",
      config: {
        agent: "custom",
        NextstepSkillSync: {
          desiredSkills: [NextstepKey],
        },
      },
    });

    expect(snapshot.supported).toBe(false);
    expect(snapshot.mode).toBe("unsupported");
    expect(snapshot.desiredSkills).toContain(NextstepKey);
    expect(snapshot.entries.find((entry) => entry.key === NextstepKey)?.desired).toBe(true);
    expect(snapshot.entries.find((entry) => entry.key === NextstepKey)?.detail).toContain("stored in Nextstep only");
    expect(snapshot.warnings).toContain(
      "Custom ACP commands do not expose a Nextstep skill integration contract yet; selected skills are tracked only.",
    );
  });
});
