# Plugin Authoring Smoke Example

A Nextstep plugin

## Development

```bash
pnpm install
pnpm dev            # watch builds
pnpm dev:ui         # local dev server with hot-reload events
pnpm test
```

## Install Into Nextstep

```bash
pnpm nextstepai plugin install ./
```

## Build Options

- `pnpm build` uses esbuild presets from `@nextstepai/plugin-sdk/bundlers`.
- `pnpm build:rollup` uses rollup presets from the same SDK.
