# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

Bun-managed monorepo (workspaces: `packages/*`) with two published npm packages:

- `packages/antd-select-async-paginate` — wrapper around antd's `Select` adding pagination-on-scroll support. This is the core package; the other package depends on it.
- `packages/antd-select-fetch` — wrapper around `antd-select-async-paginate` that loads options from a given URL.

## Commands

Run from repo root (uses `bun --filter='*'` to fan out to each package):

```
bun run build          # build all packages (tsup, esm+cjs+dts)
bun run lint           # biome check (src + __stories__) in each package
bun run lint:fix       # biome check --write --unsafe
bun run format         # biome format --write
bun run test:ts        # tsc --noEmit in each package
bun run test:unit      # vitest run (browser mode, playwright/chromium) with coverage
bun run test           # lint + test:ts + test:unit
bun run validate       # build + test (full CI gate)
bun run start          # storybook dev on port 6006 (examples for both packages)
```

To work on a single package, `cd packages/<name>` and run its own `package.json` scripts directly (same script names as above, minus the `bun --filter` fan-out). To run a single test file inside a package, use vitest directly, e.g. `vitest run src/requestOptions.test.ts`.

Unit tests run in a real browser (Playwright/Chromium via `@vitest/browser`), not jsdom — see each package's `vitest.config.ts`.

## Architecture

### `antd-select-async-paginate`

The core logic lives in a hook chain, not the component:

- `useAsyncPaginateBase` (`src/useAsyncPaginateBase.ts`) — the actual state machine. Takes already-resolved `inputValue`/`menuIsOpen` plus the rest of the params, keeps an **options cache keyed by input value** (`optionsCacheRef`, see `types.ts` `OptionsCache`), and decides when to trigger fetches (`autoload`, `menu-toggle`, `input-change`, `menu-scroll` — see `RequestOptionsCallerType`). It never re-renders via React state for the cache itself; it mutates a ref and bumps a dummy `stateId` to force a re-render, so `optionsCacheRef.current` is always the source of truth.
- `useAsyncPaginate` (`src/useAsyncPaginate.ts`) — thin wrapper that also owns `inputValue`/`menuIsOpen` as internal state (uncontrolled mode) when the caller doesn't control them, then delegates to `useAsyncPaginateBase`.
- `requestOptions` (`src/requestOptions.ts`) — does the actual `loadOptions` call, debouncing, locking (`lockedUntil`) to prevent overlapping requests, and merging results into the cache via `reduceOptions`.
- `withAsyncPaginate` (`src/withAsyncPaginate.tsx`) — HOC that wires `useAsyncPaginate`'s output into any antd `Select`-compatible component. `AsyncPaginate = withAsyncPaginate(Select)` in `src/index.ts` is the main exported component.
- `getInitialCache` / `getInitialOptionsCache` — seed the cache from `options`/`defaultOptions` props before any request has been made.
- `reduceGroupedOptions` / `defaultReduceOptions` — control how newly-loaded options are merged with existing ones (flat vs. grouped `GroupBase` options).
- `components/useComponents.ts` + `components/wrapMenuList.tsx` — wraps the `MenuList` component to hook in `handleScrolledToBottom`/`shouldLoadMore` scroll detection.

When changing loading/caching behavior, `useAsyncPaginateBase.ts` + `requestOptions.ts` + `types.ts` (`OptionsCacheItem`, `RequestOptionsCallerType`) are the files that matter together — the cache shape and the caller-type enum are threaded through all of them.

### `antd-select-fetch`

Adapts `antd-select-async-paginate` to a URL-based data source instead of a custom `loadOptions` function:

- `useMapToAsyncPaginate` — translates `SelectFetch`-specific props (url, param names, response shape) into `loadOptions`-compatible params for the underlying `useAsyncPaginate`.
- `get.ts` / `stringifyParams.ts` — build the actual fetch request.
- `useSelectFetchBase` / `useSelectFetch` / `withSelectFetch` — mirror the same base/hook/HOC layering used in `antd-select-async-paginate`.

### Cross-package convention

Both packages follow the same three-layer pattern: `use<X>Base` (pure logic, controlled inputs) → `use<X>` (adds uncontrolled state) → `with<X>` (HOC binding to an antd `Select`-like component). When adding a feature, decide which layer it belongs to before implementing — most new async/caching behavior belongs in the `Base` hook or `requestOptions`; UI/prop-forwarding concerns belong in the HOC.

## Code style

- Biome (not ESLint/Prettier) is the linter/formatter; each package has its own `biome.jsonc` extending a shared root config referenced as `"extends": "//"`.
- TypeScript strict mode, ESM (`"type": "module"` at root), target ES2021.
