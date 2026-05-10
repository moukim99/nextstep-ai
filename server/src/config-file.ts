import fs from "node:fs";
import { NextstepConfigSchema, type NextstepConfig } from "@nextstepai/shared";
import { resolveNextstepConfigPath } from "./paths.js";

export function readConfigFile(): NextstepConfig | null {
  const configPath = resolveNextstepConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return NextstepConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
