import pc from "picocolors";

const NEXTSTEP_ART = [
  "███╗   ██╗███████╗██╗  ██╗████████╗███████╗████████╗███████╗██████╗ ",
  "████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗",
  "██╔██╗ ██║█████╗   ╚███╔╝    ██║   ███████╗   ██║   █████╗  ██████╔╝",
  "██║╚██╗██║██╔══╝   ██╔██╗    ██║   ╚════██║   ██║   ██╔══╝  ██╔═══╝ ",
  "██║ ╚████║███████╗██╔╝ ██╗   ██║   ███████║   ██║   ███████╗██║     ",
  "╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ",
] as const;

const TAGLINE = "Open-source orchestration for zero-human companies";

export function printNextstepCliBanner(): void {
  const lines = [
    "",
    ...NEXTSTEP_ART.map((line) => pc.cyan(line)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
