import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveNextstepHomeDir,
  resolveNextstepInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to ~/.Nextstep and default instance", () => {
    delete process.env.NEXTSTEP_HOME;
    delete process.env.NEXTSTEP_INSTANCE_ID;

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(os.homedir(), ".Nextstep"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(os.homedir(), ".Nextstep", "instances", "default", "config.json"));
  });

  it("supports NEXTSTEP_HOME and explicit instance ids", () => {
    process.env.NEXTSTEP_HOME = "~/Nextstep-home";

    const home = resolveNextstepHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "Nextstep-home"));
    expect(resolveNextstepInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveNextstepInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
