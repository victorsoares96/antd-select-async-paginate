# Migrate react-select-async-paginate to antd Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `react-select` with antd's `Select` (built on `rc-select`) as the underlying component for both packages in this monorepo, renaming them to `antd-select-async-paginate` and `antd-select-fetch`, while preserving the existing cache/pagination hook architecture and the "value/onChange always carry the full option object" contract.

**Architecture:** The three-layer pattern (`use<X>Base` pure logic → `use<X>` uncontrolled-state wrapper → `with<X>` HOC binding to a Select-like component) stays. Only the HOC layer (`withAsyncPaginate.tsx`, `withSelectFetch.tsx`) and the small slice of hook code that talks to Select-specific props (scroll detection, filter defaults) change. `react-select`'s type re-exports (`GroupBase`, `OptionsOrGroups`, `MultiValue`) are replaced with equivalent types owned by this package, since antd doesn't ship them — this keeps `OptionType`/`Additional` fully generic, unlike forcing antd's `{label, value}` convention.

**Tech Stack:** antd `^5` (peer dep, replaces `react-select` peer dep), React 19, TypeScript strict, Biome, Vitest browser mode (Playwright/Chromium), tsup, Bun workspaces.

## Global Constraints

- antd version target: `^5` only (no v4 compat).
- `OptionType` stays fully generic (no forced `{label, value}` shape) — achieved via antd's `fieldNames` prop.
- `value`/`onChange` on the public API must always carry the full option object (single) or array of full option objects (multi) — never antd's raw primitive value. Achieved by using the 2nd argument of antd's `onChange(value, option)`.
- Infinite-scroll detection uses antd's native `onPopupScroll` event — no polling, no `MenuList` component wrapping.
- Packages are renamed: `react-select-async-paginate` → `antd-select-async-paginate`, `react-select-fetch` → `antd-select-fetch`. Both reset to version `0.1.0`.
- Virtual scrolling in antd's Select (`virtual` prop, default `true`) must default to `false` in `AsyncPaginate`/`SelectFetch` to preserve existing "all loaded options exist in the DOM" behavior that `shouldLoadMore`/tests rely on. Consumers can opt back into `virtual={true}` explicitly.
- This is a personal fork (`victorsoares96/antd-select-async-paginate`) building something new from an existing OSS base (`vtaits/react-select-async-paginate`) — no obligation to the upstream project or its published npm packages.
- Git history reset (fresh `.git`, force-push to `origin`) happens **only** as the final task, after `bun run validate` passes, and requires explicit interactive confirmation before running (destructive, rewrites public GitHub history).

---

## Known scope reduction (flag before starting)

`react-select/creatable`'s `Creatable` component (used in the `Creatable` and `CreatableWithNewOptions` stories, in both packages) has **no antd equivalent** — antd's closest primitive is `mode="tags"`, which is multi-select-only free-text tagging, not the same "single-select with an inline 'create new' affordance and an `onCreateOption` callback + loading state" UX. This plan does **not** add creatable support to the library itself. It reimplements the two demo stories with a small DIY pattern (a "Create …" pseudo-option rendered via `notFoundContent`/injected into `options`) that calls the same `onCreateOption` callback used today, purely to keep the storybook example set complete. If real creatable support belongs in the library's public API, that needs its own follow-up plan — surface this to the user before starting Task 15.

---

## File Structure

**`packages/antd-select-async-paginate/`** (renamed from `react-select-async-paginate`):
- `src/types.ts` — owns `GroupBase`, `OptionsOrGroups` (replacing react-select's), all existing param/result types, updated `FilterOption`/`UseAsyncPaginateParams` for antd's `filterOption` signature and `handlePopupScroll`.
- `src/defaultReduceOptions.ts`, `src/reduceGroupedOptions.ts`, `src/getInitialCache.ts`, `src/getInitialOptionsCache.ts`, `src/validateResponse.ts`, `src/requestOptions.ts` — unchanged logic, import types from `./types` instead of `react-select`.
- `src/useAsyncPaginateBase.ts` — `filterOption` default `false` (was `null`), exposes `handlePopupScroll(event)` (was `handleScrolledToBottom()`).
- `src/useAsyncPaginate.ts` — `onInputChange` loses the react-select `InputActionMeta` 2nd argument (antd's `onSearch` has none).
- `src/withAsyncPaginate.tsx` — rewritten around antd's `Select`: wires `fieldNames`, `onPopupScroll`, `onSearch`/`searchValue`, `open`/`onOpenChange`, `loading`, `virtual={false}` default, and the value/onChange full-option-object translation.
- `src/index.ts` — drop `wrapMenuList`/`useComponents` exports, `AsyncPaginate = withAsyncPaginate(Select)` from `antd`.
- `src/components/` — **deleted** (`useComponents.ts`, `wrapMenuList.tsx`).
- `package.json` — renamed, version `0.1.0`, `antd ^5` peer dep replaces `react-select`, drop `@seznam/compose-react-refs`.
- `__stories__/testUtils.ts` — `getSingleValue`/`getMultipleValue` target antd's DOM classes.
- `__stories__/*/*.tsx` + `*.spec.tsx` — updated per-story (see Tasks 12–15).

**`packages/antd-select-fetch/`** (renamed from `react-select-fetch`):
- `src/types.ts`, `src/useMapToAsyncPaginate.ts`, `src/useSelectFetchBase.ts`, `src/useSelectFetch.ts` — import `GroupBase` from `antd-select-async-paginate` instead of `react-select`.
- `src/withSelectFetch.tsx` — same antd rewrite pattern as `withAsyncPaginate.tsx`, no `useComponents` call.
- `src/index.ts` — `SelectFetch = withSelectFetch(Select)` from `antd`.
- `package.json` — renamed, version `0.1.0`, peer deps updated.
- `__stories__/*` — updated per Task 16.

**Root:** `package.json` (workspace deps if any hoisted — none expected), READMEs.

---

## Task 1: Rewrite core types to drop the `react-select` dependency

**Files:**
- Modify: `packages/react-select-async-paginate/src/types.ts`
- Test: `packages/react-select-async-paginate/src/types.ts` has no test file; verified via `tsc --noEmit` in Task 1 Step 3 and by every later task's tests compiling.

**Interfaces:**
- Produces: `GroupBase<OptionType>`, `OptionsOrGroups<OptionType, Group>`, `ReduceOptions`, `OptionsCacheItem`, `OptionsCache`, `ShouldLoadMore`, `Response`, `LoadOptions`, `FilterOption`, `UseAsyncPaginateBaseResult` (now has `handlePopupScroll` instead of `handleScrolledToBottom`), `UseAsyncPaginateResult`, `UseAsyncPaginateParams` (now `onInputChange?: (newValue: string) => void`, no `InputActionMeta`), `UseAsyncPaginateBaseParams`, `ComponentProps`, `AsyncPaginateProps`, `WithAsyncPaginateType` — all consumed by every other task in this plan.

- [ ] **Step 1: Replace react-select type imports with self-owned equivalents**

Replace the full contents of `packages/react-select-async-paginate/src/types.ts` with:

```ts
import type { ReactElement, Ref, UIEvent } from "react";
import type { SelectProps as AntdSelectProps } from "antd";

export type RequestOptionsCallerType =
	| "autoload"
	| "menu-toggle"
	| "input-change"
	| "menu-scroll";

export type GroupBase<OptionType> = {
	label?: string;
	options: readonly OptionType[];
};

export type OptionsOrGroups<
	OptionType,
	Group extends GroupBase<OptionType>,
> = ReadonlyArray<OptionType | Group>;

export type ReduceOptions<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = (
	prevOptions: OptionsOrGroups<OptionType, Group>,
	loadedOptions: OptionsOrGroups<OptionType, Group>,
	additional: Additional | undefined,
) => OptionsOrGroups<OptionType, Group>;

export type OptionsCacheItem<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	isFirstLoad: boolean;
	isLoading: boolean;
	lockedUntil: number;
	options: OptionsOrGroups<OptionType, Group>;
	hasMore: boolean;
	additional?: Additional;
};

export type OptionsCache<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	[key: string]: OptionsCacheItem<OptionType, Group, Additional>;
};

export type ShouldLoadMore = (
	scrollHeight: number,
	clientHeight: number,
	scrollTop: number,
) => boolean;

export type Response<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	options: OptionsOrGroups<OptionType, Group>;
	hasMore?: boolean;
	additional?: Additional;
};

export type LoadOptions<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = (
	inputValue: string,
	options: OptionsOrGroups<OptionType, Group>,
	additional?: Additional,
) =>
	| Response<OptionType, Group, Additional>
	| Promise<Response<OptionType, Group, Additional>>;

export type FilterOption<OptionType> =
	| ((inputValue: string, option: OptionType | undefined) => boolean)
	| false;

export type UseAsyncPaginateBaseResult<
	OptionType,
	Group extends GroupBase<OptionType>,
> = {
	handlePopupScroll: (event: UIEvent<HTMLDivElement>) => void;
	shouldLoadMore: ShouldLoadMore;
	isLoading: boolean;
	isFirstLoad: boolean;
	options: OptionsOrGroups<OptionType, Group>;
	filterOption: FilterOption<OptionType>;
};

export type UseAsyncPaginateResult<
	OptionType,
	Group extends GroupBase<OptionType>,
> = UseAsyncPaginateBaseResult<OptionType, Group> & {
	inputValue: string;
	menuIsOpen: boolean;
	onInputChange: (newValue: string) => void;
	onMenuClose: () => void;
	onMenuOpen: () => void;
};

export type UseAsyncPaginateParams<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	/**
	 * Clear all cached options on search change
	 */
	clearCacheOnSearchChange?: boolean;
	/**
	 * Clear all cached options on menu close
	 */
	clearCacheOnMenuClose?: boolean;
	loadOptions: LoadOptions<OptionType, Group, Additional>;
	options?: OptionsOrGroups<OptionType, Group>;
	defaultOptions?: boolean | OptionsOrGroups<OptionType, Group>;
	additional?: Additional;
	defaultAdditional?: Additional;
	loadOptionsOnMenuOpen?: boolean;
	debounceTimeout?: number;
	reduceOptions?: ReduceOptions<OptionType, Group, Additional>;
	shouldLoadMore?: ShouldLoadMore;
	filterOption?: FilterOption<OptionType>;
	inputValue?: string;
	menuIsOpen?: boolean;
	defaultInputValue?: string;
	defaultMenuIsOpen?: boolean;
	/**
	 * Post-mapping of loaded options to display them in the menu
	 * @param options loaded options
	 * @returns options to display in the menu
	 */
	mapOptionsForMenu?: (
		options: OptionsOrGroups<OptionType, Group>,
	) => OptionsOrGroups<OptionType, Group>;
	onInputChange?: (newValue: string) => void;
	onMenuClose?: () => void;
	onMenuOpen?: () => void;
	reloadOnErrorTimeout?: number;
};

export type UseAsyncPaginateBaseParams<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = UseAsyncPaginateParams<OptionType, Group, Additional> & {
	inputValue: string;
	menuIsOpen: boolean;
};

export type ComponentProps<OptionType> = {
	selectRef?: Ref<HTMLElement>;
	cacheUniqs?: ReadonlyArray<unknown>;
};

export type AsyncPaginateProps<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
	IsMulti extends boolean,
> = Omit<AntdSelectProps<OptionType, OptionType>, "options" | "onChange"> &
	UseAsyncPaginateParams<OptionType, Group, Additional> &
	ComponentProps<OptionType> & {
		mode?: IsMulti extends true ? "multiple" | "tags" : undefined;
		value?: IsMulti extends true
			? readonly OptionType[] | null
			: OptionType | null;
		onChange?: (
			value: IsMulti extends true ? OptionType[] : OptionType | null,
		) => void;
	};

export type WithAsyncPaginateType = <
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
	IsMulti extends boolean = false,
>(
	props: AsyncPaginateProps<OptionType, Group, Additional, IsMulti>,
) => ReactElement;
```

- [ ] **Step 2: Verify `antd` is resolvable for the type import**

`antd` isn't installed yet (Task 2 adds it). Confirm the import at least parses correctly once installed — this step is just a note; actual verification happens after Task 2's `bun install`. Do not run `tsc` yet, it will fail until Task 2 completes.

- [ ] **Step 3: Commit is deferred**

Do not commit yet — `types.ts` alone doesn't compile without `antd` installed (Task 2) and every consumer file still importing from `react-select` (Tasks 3–9). Commit happens at the end of Task 9.

---

## Task 2: Swap `react-select` for `antd` in package manifests

**Files:**
- Modify: `packages/react-select-async-paginate/package.json`
- Modify: `packages/react-select-fetch/package.json`

**Interfaces:**
- Produces: `antd` resolvable as both a peer dependency and a dev dependency (needed for the package's own tests/storybook) in `antd-select-async-paginate`. `antd-select-fetch` only needs it as peer + dev dep too (its stories render `<SelectFetch>`, which renders antd's `Select` under the hood).

- [ ] **Step 1: Edit `packages/react-select-async-paginate/package.json`**

Replace the `peerDependencies` and `devDependencies` blocks:

```json
  "peerDependencies": {
    "antd": "^5.0.0",
    "react": "^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "dependencies": {
    "@vtaits/use-lazy-ref": "^0.1.4",
    "krustykrab": "^1.1.0",
    "sleep-promise": "^9.1.0",
    "use-is-mounted-ref": "^1.5.0",
    "use-latest": "^1.3.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.2.4",
    "@storybook/react-vite": "^9.1.9",
    "@types/node": "^24.6.1",
    "@types/react": "^19.1.16",
    "@vitejs/plugin-react": "^5.0.4",
    "@vitest/browser": "^3.2.4",
    "@vitest/coverage-v8": "^3.2.4",
    "antd": "^5.22.0",
    "playwright": "^1.55.1",
    "react": "^19.1.1",
    "tsup": "^8.5.0",
    "typescript": "5.9.3",
    "vitest": "^3.2.4",
    "vitest-browser-react": "^1.0.1"
  }
```

Note `@seznam/compose-react-refs` is dropped (only used by the now-deleted `wrapMenuList.tsx`).

- [ ] **Step 2: Edit `packages/react-select-fetch/package.json`**

Replace `peerDependencies` and the `react-select`/`react-select-async-paginate` dev entries:

```json
  "peerDependencies": {
    "antd": "^5.0.0",
    "antd-select-async-paginate": "^0.1.0",
    "react": "^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
```

and in `devDependencies`, replace `"react-select": "^5.10.2"` and `"react-select-async-paginate": "^0.7.11"` with:

```json
    "antd": "^5.22.0",
    "antd-select-async-paginate": "0.1.0",
```

(Package renames themselves — the `name` field, keywords, repository/homepage URLs — happen in Task 17 alongside the version bump, once the code inside actually works. Renaming the folder now would break every relative import path referenced by later tasks.)

- [ ] **Step 3: Install**

Run: `bun install`
Expected: lockfile updates, `antd` resolves in both packages' `node_modules`, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/react-select-async-paginate/package.json packages/react-select-fetch/package.json bun.lock
git commit -m "chore: replace react-select with antd in package manifests"
```

---

## Task 3: Repoint the pure-logic files' type imports

**Files:**
- Modify: `packages/react-select-async-paginate/src/defaultReduceOptions.ts`
- Modify: `packages/react-select-async-paginate/src/reduceGroupedOptions.ts`
- Modify: `packages/react-select-async-paginate/src/getInitialCache.ts`
- Modify: `packages/react-select-async-paginate/src/getInitialOptionsCache.ts`
- Modify: `packages/react-select-async-paginate/src/validateResponse.ts`
- Modify: `packages/react-select-async-paginate/src/requestOptions.ts`
- Modify: `packages/react-select-async-paginate/src/defaultShouldLoadMore.ts` (no react-select import today — confirm still true, no change needed, listed for completeness)
- Test: `packages/react-select-async-paginate/src/defaultReduceOptions.test.ts`, `reduceGroupedOptions.test.ts`, `getInitialCache.test.ts`, `getInitialOptionsCache.test.ts`, `validateResponse.test.ts`, `requestOptions.test.ts`

**Interfaces:**
- Consumes: `GroupBase`, `OptionsOrGroups` from `./types` (Task 1).
- Produces: no behavior change — same function signatures as before, only the import source changes.

- [ ] **Step 1: Swap the import line in each source file**

In `defaultReduceOptions.ts`, `reduceGroupedOptions.ts`, `getInitialCache.ts`, `getInitialOptionsCache.ts`, `validateResponse.ts`, `requestOptions.ts`, change:

```ts
import type { GroupBase } from "react-select";
```
or
```ts
import type { GroupBase, OptionsOrGroups } from "react-select";
```

to import the same names from `./types` instead (relative path already correct since these files live in `src/` alongside `types.ts`):

```ts
import type { GroupBase } from "./types";
```
or
```ts
import type { GroupBase, OptionsOrGroups } from "./types";
```

Nothing else in these six files changes — no logic touches react-select beyond these type-only imports (verified in Task 1's Explore output: `defaultReduceOptions.ts`, `getInitialCache.ts`, `getInitialOptionsCache.ts`, `validateResponse.ts` import only `GroupBase`; `reduceGroupedOptions.ts` imports `GroupBase, OptionsOrGroups`; `requestOptions.ts` imports `GroupBase` and separately imports `getInitialCache`/types from local files already).

- [ ] **Step 2: Swap the same import in each corresponding `.test.ts` file**

Open each of `defaultReduceOptions.test.ts`, `reduceGroupedOptions.test.ts`, `getInitialCache.test.ts`, `getInitialOptionsCache.test.ts`, `validateResponse.test.ts`, `requestOptions.test.ts`. Wherever they `import type { GroupBase } from "react-select"` (or similar) to type their test fixtures, repoint to `../src/types` if the test lives outside `src/`, or `./types` if colocated (these all live in `src/` per the earlier directory listing, so `./types`).

- [ ] **Step 3: Run unit tests for these files**

Run: `cd packages/react-select-async-paginate && bunx vitest run src/defaultReduceOptions.test.ts src/reduceGroupedOptions.test.ts src/getInitialCache.test.ts src/getInitialOptionsCache.test.ts src/validateResponse.test.ts --browser.headless`
Expected: PASS (these tests exercise pure functions, unaffected by the type source change).

`requestOptions.test.ts` is deferred to Task 6's verification since it constructs `UseAsyncPaginateBaseParams` fixtures that also need the `filterOption`/`handlePopupScroll` shape change.

- [ ] **Step 4: Commit**

```bash
git add packages/react-select-async-paginate/src/defaultReduceOptions.ts packages/react-select-async-paginate/src/reduceGroupedOptions.ts packages/react-select-async-paginate/src/getInitialCache.ts packages/react-select-async-paginate/src/getInitialOptionsCache.ts packages/react-select-async-paginate/src/validateResponse.ts packages/react-select-async-paginate/src/requestOptions.ts packages/react-select-async-paginate/src/defaultReduceOptions.test.ts packages/react-select-async-paginate/src/reduceGroupedOptions.test.ts packages/react-select-async-paginate/src/getInitialCache.test.ts packages/react-select-async-paginate/src/getInitialOptionsCache.test.ts packages/react-select-async-paginate/src/validateResponse.test.ts
git commit -m "refactor: repoint GroupBase/OptionsOrGroups imports from react-select to local types"
```

---

## Task 4: Delete the `MenuList`-wrapping polling mechanism

**Files:**
- Delete: `packages/react-select-async-paginate/src/components/wrapMenuList.tsx`
- Delete: `packages/react-select-async-paginate/src/components/useComponents.ts`
- Delete: `packages/react-select-async-paginate/src/components/` (now empty)

**Interfaces:**
- Produces: nothing — this functionality is replaced by `onPopupScroll` wired directly in `withAsyncPaginate.tsx` (Task 7).

- [ ] **Step 1: Delete the files**

```bash
git rm packages/react-select-async-paginate/src/components/wrapMenuList.tsx packages/react-select-async-paginate/src/components/useComponents.ts
```

- [ ] **Step 2: Commit**

This leaves `index.ts` (Task 8) and `withAsyncPaginate.tsx` (Task 7) referencing deleted exports until those tasks land — that's expected, the branch won't compile until Task 8 completes. Commit anyway to keep history granular:

```bash
git commit -m "refactor: remove MenuList-wrapping scroll-polling hack"
```

---

## Task 5: Update `useAsyncPaginateBase` for `onPopupScroll` + `filterOption` default

**Files:**
- Modify: `packages/react-select-async-paginate/src/useAsyncPaginateBase.ts`

**Interfaces:**
- Consumes: `getInitialCache`, `getInitialOptionsCache`, `requestOptions`, `defaultReduceOptions`, `defaultShouldLoadMore` (all unchanged, Task 3).
- Produces: `handlePopupScroll(event: UIEvent<HTMLDivElement>): void` (replaces `handleScrolledToBottom(): void`), `filterOption` defaults to `false` — consumed by `withAsyncPaginate.tsx` (Task 7) and `useAsyncPaginate.ts` (Task 6).

- [ ] **Step 1: Change the default `filterOption` value and the scroll handler**

In `useAsyncPaginateBase.ts`:

1. Change the destructured default:

```ts
	filterOption = false,
```

(was `filterOption = null,`)

2. Replace the `handleScrolledToBottom` callback with `handlePopupScroll`, reading scroll metrics off the event instead of assuming an external polling loop already computed them:

```ts
	const handlePopupScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

			if (!shouldLoadMore(scrollHeight, clientHeight, scrollTop)) {
				return;
			}

			const currentInputValue = paramsRef.current.inputValue;
			const currentOptions = optionsCacheRef.current[currentInputValue];

			if (currentOptions) {
				callRequestOptionsRef.current("menu-scroll");
			}
		},
		[callRequestOptionsRef, optionsCacheRef, shouldLoadMore],
	);
```

3. Add `UIEvent` to the `react` import:

```ts
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
```

4. In the returned object at the bottom of the hook, replace `handleScrolledToBottom` with `handlePopupScroll`:

```ts
	return {
		handlePopupScroll,
		shouldLoadMore,
		filterOption,
		isLoading:
			currentOptions.isLoading || currentOptions.lockedUntil > Date.now(),
		isFirstLoad: currentOptions.isFirstLoad,
		options,
	};
```

- [ ] **Step 2: Write a unit test covering the new scroll handler**

Add to a new file `packages/react-select-async-paginate/src/useAsyncPaginateBase.test.ts` (none exists today — this hook was previously only exercised indirectly through the story `.spec.tsx` files; now that `handlePopupScroll` is a pure event-driven function, it's worth a direct test):

```ts
import { renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useAsyncPaginateBase } from "./useAsyncPaginateBase";
import type { UseAsyncPaginateBaseParams } from "./types";

type OptionType = { value: number; label: string };

const buildEvent = (scrollTop: number, scrollHeight: number, clientHeight: number) =>
	({
		currentTarget: { scrollTop, scrollHeight, clientHeight },
	}) as unknown as import("react").UIEvent<HTMLDivElement>;

describe("useAsyncPaginateBase handlePopupScroll", () => {
	test("triggers a new request when scrolled near the bottom and options are cached", async () => {
		const loadOptions = vi.fn().mockResolvedValue({
			options: [{ value: 2, label: "Two" }],
			hasMore: false,
		});

		const params: UseAsyncPaginateBaseParams<OptionType, never, unknown> = {
			loadOptions,
			inputValue: "",
			menuIsOpen: true,
			defaultOptions: [{ value: 1, label: "One" }],
		};

		const { result } = renderHook(() => useAsyncPaginateBase(params));

		result.current.handlePopupScroll(buildEvent(100, 120, 20));

		await vi.waitFor(() => {
			expect(loadOptions).toHaveBeenCalledWith(
				"",
				[{ value: 1, label: "One" }],
				undefined,
			);
		});
	});

	test("does nothing when not scrolled near the bottom", () => {
		const loadOptions = vi.fn();

		const params: UseAsyncPaginateBaseParams<OptionType, never, unknown> = {
			loadOptions,
			inputValue: "",
			menuIsOpen: true,
			defaultOptions: [{ value: 1, label: "One" }],
		};

		const { result } = renderHook(() => useAsyncPaginateBase(params));

		result.current.handlePopupScroll(buildEvent(0, 500, 20));

		expect(loadOptions).not.toHaveBeenCalled();
	});
});
```

This uses `@testing-library/react`'s `renderHook`, not currently a dependency — add it:

Run: `cd packages/react-select-async-paginate && bun add -d @testing-library/react`

- [ ] **Step 3: Run the test, confirm it fails first for the right reason**

Run: `cd packages/react-select-async-paginate && bunx vitest run src/useAsyncPaginateBase.test.ts --browser.headless`
Expected before Step 1's edits are saved: FAIL (`handlePopupScroll is not a function`). Since Step 1 already happened above, instead just confirm it now PASSES — if it doesn't, re-check the `shouldLoadMore` wiring (default `defaultShouldLoadMore` treats "near bottom" as `scrollHeight - clientHeight - 10 < scrollTop`; the first test uses `100 < 120 - 20 - 10 = 90`? recompute: `scrollHeight=120, clientHeight=20` → bottom border `= 120-20-10=90`; `scrollTop=100 > 90` → triggers. Second test: `scrollHeight=500, clientHeight=20` → bottom border `=470`; `scrollTop=0 < 470` → does not trigger. Both assertions match the implementation.

- [ ] **Step 4: Run full package test-unit + test:ts**

Run: `cd packages/react-select-async-paginate && bun run test:ts`
Expected: fails still, because `useAsyncPaginate.ts` (Task 6), `withAsyncPaginate.tsx` (Task 7), and `index.ts` (Task 8) haven't been updated yet and still reference `handleScrolledToBottom`/deleted files. This is expected — do not try to make it pass yet.

- [ ] **Step 5: Commit**

```bash
git add packages/react-select-async-paginate/src/useAsyncPaginateBase.ts packages/react-select-async-paginate/src/useAsyncPaginateBase.test.ts packages/react-select-async-paginate/package.json bun.lock
git commit -m "feat: replace scroll-polling with event-driven handlePopupScroll"
```

---

## Task 6: Update `useAsyncPaginate` for antd's `onSearch` (no `InputActionMeta`)

**Files:**
- Modify: `packages/react-select-async-paginate/src/useAsyncPaginate.ts`

**Interfaces:**
- Consumes: `useAsyncPaginateBase` (Task 5), `UseAsyncPaginateResult`/`UseAsyncPaginateParams` types (Task 1, already updated to drop `InputActionMeta`).
- Produces: `onInputChange: (newValue: string) => void` — consumed by `withAsyncPaginate.tsx` (Task 7) wired to antd's `onSearch`.

- [ ] **Step 1: Drop `InputActionMeta` from the import and the callback signature**

Change the top import from:

```ts
import type { GroupBase, InputActionMeta } from "react-select";
```

to:

```ts
import type { GroupBase } from "./types";
```

Change `onInputChange`:

```ts
	const onInputChange = useCallback(
		(nextInputValue: string): void => {
			if (onInputChangeParam) {
				onInputChangeParam(nextInputValue);
			}

			setInputValue(nextInputValue);
		},
		[onInputChangeParam],
	);
```

Everything else in the file (menu open/close state handling) is unchanged.

- [ ] **Step 2: Run `test:ts` scoped to this file's dependents**

Run: `cd packages/react-select-async-paginate && bunx tsc --noEmit`
Expected: still FAILS — `withAsyncPaginate.tsx` and `index.ts` are next. Confirm the *specific* errors reported no longer mention `useAsyncPaginate.ts` or `InputActionMeta`; remaining errors should only be in `withAsyncPaginate.tsx`, `index.ts`, and files not yet touched.

- [ ] **Step 3: Commit**

```bash
git add packages/react-select-async-paginate/src/useAsyncPaginate.ts
git commit -m "refactor: drop InputActionMeta from onInputChange, matching antd's onSearch"
```

---

## Task 7: Rewrite `withAsyncPaginate.tsx` around antd's `Select`

**Files:**
- Modify: `packages/react-select-async-paginate/src/withAsyncPaginate.tsx`

**Interfaces:**
- Consumes: `useAsyncPaginate` (Task 6) returning `{ handlePopupScroll, shouldLoadMore, filterOption, isLoading, isFirstLoad, options, inputValue, menuIsOpen, onInputChange, onMenuClose, onMenuOpen }`; `AsyncPaginateProps`, `UseAsyncPaginateResult`, `WithAsyncPaginateType` from `./types`.
- Produces: `withAsyncPaginate(SelectComponent)` — a HOC producing a component consumed by `index.ts` (Task 8) as `AsyncPaginate = withAsyncPaginate(Select)`.

- [ ] **Step 1: Replace the file contents**

```tsx
import type { GetProp, Select as AntdSelect } from "antd";
import type { ReactElement, Ref } from "react";
import { useCallback } from "react";
import type {
	AsyncPaginateProps,
	GroupBase,
	UseAsyncPaginateResult,
	WithAsyncPaginateType,
} from "./types";
import { useAsyncPaginate } from "./useAsyncPaginate";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;

export function withAsyncPaginate(
	SelectComponent: typeof AntdSelect,
): WithAsyncPaginateType {
	function WithAsyncPaginate<
		OptionType,
		Group extends GroupBase<OptionType>,
		Additional,
		IsMulti extends boolean = false,
	>(
		props: AsyncPaginateProps<OptionType, Group, Additional, IsMulti>,
	): ReactElement {
		const {
			selectRef = undefined,
			loading: isLoadingProp,
			cacheUniqs = defaultCacheUniqs,
			virtual = false,
			onChange,
			...rest
		} = props;

		const asyncPaginateProps: UseAsyncPaginateResult<OptionType, Group> =
			useAsyncPaginate(rest, cacheUniqs);

		const isLoading =
			typeof isLoadingProp === "boolean"
				? isLoadingProp
				: asyncPaginateProps.isLoading;

		// antd's onChange(value, option) always gives the full option object(s)
		// as the 2nd argument — that's what this library's value/onChange
		// contract has always exposed, so ignore the primitive 1st argument.
		const handleChange = useCallback<AntdOnChange>(
			(_value, option) => {
				onChange?.(option as never);
			},
			[onChange],
		);

		return (
			<SelectComponent
				{...(rest as object)}
				options={asyncPaginateProps.options as never}
				searchValue={asyncPaginateProps.inputValue}
				onSearch={asyncPaginateProps.onInputChange}
				open={asyncPaginateProps.menuIsOpen}
				onOpenChange={(open) => {
					if (open) {
						asyncPaginateProps.onMenuOpen();
					} else {
						asyncPaginateProps.onMenuClose();
					}
				}}
				onPopupScroll={asyncPaginateProps.handlePopupScroll}
				filterOption={asyncPaginateProps.filterOption}
				loading={isLoading}
				virtual={virtual}
				onChange={handleChange}
				ref={selectRef as Ref<never>}
			/>
		);
	}

	return WithAsyncPaginate;
}
```

Notes on what was intentionally dropped versus the react-select version: `menuPlacement`/`menuShouldScrollIntoView` (react-select-only props for repositioning the menu on load — antd's `placement` prop doesn't need this workaround since antd repositions automatically); `components` prop (no more `MenuList` injection needed).

- [ ] **Step 2: Run `test:ts`**

Run: `cd packages/react-select-async-paginate && bunx tsc --noEmit`
Expected: remaining errors should now only be in `index.ts` (Task 8, still exports deleted `useComponents`/`wrapMenuList`) and any `__stories__`/test files not yet touched (Tasks 12–14). If `withAsyncPaginate.tsx` itself reports errors, fix the generic constraints before moving on — this file must type-check standalone.

- [ ] **Step 3: Commit**

```bash
git add packages/react-select-async-paginate/src/withAsyncPaginate.tsx
git commit -m "feat: rewrite withAsyncPaginate around antd Select"
```

---

## Task 8: Update the package barrel export

**Files:**
- Modify: `packages/react-select-async-paginate/src/index.ts`

**Interfaces:**
- Produces: `AsyncPaginate`, `useComponents` (removed), `wrapMenuList` (removed), `withAsyncPaginate`, `useAsyncPaginate`, `useAsyncPaginateBase`, `checkIsResponse`, `validateResponse`, plus `export * from "./types"` — consumed by `antd-select-fetch` (Task 9) and every story (Tasks 12–15).

- [ ] **Step 1: Replace the file contents**

```ts
import { Select } from "antd";
import { withAsyncPaginate } from "./withAsyncPaginate";

export { reduceGroupedOptions } from "./reduceGroupedOptions";

export { withAsyncPaginate };

export { useAsyncPaginate } from "./useAsyncPaginate";
export { useAsyncPaginateBase } from "./useAsyncPaginateBase";
export {
	checkIsResponse,
	validateResponse,
} from "./validateResponse";

export const AsyncPaginate = withAsyncPaginate(Select);

export * from "./types";
```

- [ ] **Step 2: Run full package validation**

Run: `cd packages/react-select-async-paginate && bun run test:ts`
Expected: PASS (all `src/*.ts(x)` files, excluding `__stories__`, now type-check — stories are fixed in Tasks 12–14 and currently still reference the old react-select API, which is fine, `test:ts` is `tsc --noEmit` scoped by `tsconfig.json`'s `include`; check `packages/react-select-async-paginate/tsconfig.json` to confirm whether it includes `__stories__` — if it does, this step will still fail until Task 12–14 land, in which case skip this verification until after Task 14 and note that here).

Run: `cd packages/react-select-async-paginate && bunx vitest run src --browser.headless`
Expected: all `src/*.test.ts` PASS (these don't touch antd's actual rendering, only the hook/pure-function layer).

- [ ] **Step 3: Commit**

```bash
git add packages/react-select-async-paginate/src/index.ts
git commit -m "feat: export AsyncPaginate built on antd Select"
```

---

## Task 9: Rewrite `testUtils.ts` for antd's DOM structure

**Files:**
- Modify: `packages/react-select-async-paginate/__stories__/testUtils.ts`

**Interfaces:**
- Produces: `getInput`, `getMenu`, `openMenu`, `closeMenu`, `type`, `clearText`, `scroll`, `getAllOptions`, `getAllGroups`, `getSingleValue`, `getMultipleValue`, `getMenuOption` — consumed by every `*.spec.tsx` in Tasks 12–14, 16.

- [ ] **Step 1: Confirm ARIA roles are unchanged, update only the value-display selectors**

`rc-select` (which antd's `Select` wraps) renders the search input with `role="combobox"` and the dropdown with `role="listbox"`/`role="option"` — same roles `react-select` used, so `getInput`, `getMenu`, `openMenu`, `closeMenu`, `type`, `clearText`, `getAllOptions`, `getMenuOption` keep working unchanged. Only `getSingleValue`/`getMultipleValue` queried react-select-specific class names (`[class*="-singleValue"]`, `[class*="-multiValue"]`) and must target antd's classes instead (`.ant-select-selection-item` for both single value and each multi-select tag). `getAllGroups` queried text starting with "Type" — that was coupled to the `GroupedOptions` story's fixture data (group labels are `Type #1`, `Type #2`, ...), not to react-select's DOM, so it's unchanged.

Replace `getSingleValue` and `getMultipleValue`:

```ts
export function getSingleValue(screen: RenderResult) {
	return unwrap(
		screen.baseElement.querySelector(
			".ant-select-selection-item",
		) as HTMLElement | null,
	);
}

export function getMultipleValue(screen: RenderResult) {
	return [
		...screen.baseElement.querySelectorAll(".ant-select-selection-item"),
	].map((el) => {
		const content = el.querySelector(".ant-select-selection-item-content");
		return (content ?? el).textContent;
	});
}
```

(antd wraps each multi-select tag's label text in a `.ant-select-selection-item-content` span, separate from the remove `×` icon — querying that span avoids picking up the icon's accessible text. Single-select doesn't wrap the label in that span, hence the `content ?? el` fallback.)

- [ ] **Step 2: Run one already-adapted spec to validate the selectors**

This can't run standalone yet — `Simple.tsx`/`Simple.spec.tsx` (Task 12) still reference the old API. Proceed to Task 12, then return here if selectors need adjustment (e.g., if antd renders differently than documented — verify empirically, don't assume).

- [ ] **Step 3: Commit (bundled with Task 12, since it can only be verified together)**

Deferred — commit alongside Task 12's commit.

---

## Task 10: Delete unused `@seznam/compose-react-refs` and stray imports

**Files:**
- Modify: `packages/react-select-async-paginate/package.json` (already handled in Task 2 — this task just double-checks nothing else imports it)

**Interfaces:**
- None.

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -r "compose-react-refs" packages/react-select-async-paginate/src` (or use the Grep tool)
Expected: no matches (the only usage was in the deleted `wrapMenuList.tsx`).

- [ ] **Step 2: No commit needed** — this is a verification-only task; Task 2 already removed the dependency.

---

## Task 11: Reference `Simple` story/spec as the migration pattern, apply it

**Files:**
- Modify: `packages/react-select-async-paginate/__stories__/Simple/Simple.tsx`
- Modify: `packages/react-select-async-paginate/__stories__/Simple/Simple.spec.tsx`
- Test: same `.spec.tsx` file (stories and their tests are the same file pair in this codebase).

**Interfaces:**
- Consumes: `AsyncPaginate`, `LoadOptions`, `GroupBase` from `../../src` (Task 8); `getInput`/`getMenu`/`getAllOptions`/`getMenuOption`/`getSingleValue`/`getMultipleValue`/`openMenu`/`scroll`/`type` from `../testUtils` (Task 9).

- [ ] **Step 1: Rewrite `Simple.tsx`**

The only react-select-specific bits are the `GroupBase, MultiValue` import and the `value` state type. Change:

```tsx
import type { GroupBase, MultiValue } from "react-select";
```

to:

```tsx
import type { GroupBase } from "../../src";
```

and change the state type from `OptionType | MultiValue<OptionType> | null` to `OptionType | OptionType[] | null`:

```tsx
	const [value, onChange] = useState<OptionType | OptionType[] | null>(null);
```

Everything else in the file (`loadOptions`, the `<AsyncPaginate {...props} value={value} loadOptions={...} onChange={onChange} />` JSX) is unchanged — `AsyncPaginate`'s new `onChange` (Task 7) already delivers the full option object(s), matching this state setter's expectations exactly.

- [ ] **Step 2: Run the existing spec to see what breaks**

Run: `cd packages/react-select-async-paginate && bunx vitest run __stories__/Simple/Simple.spec.tsx --browser.headless`
Expected: FAIL initially — react-select's multi-select renders each selection as a `[class*="-multiValue"]` chip; antd renders `.ant-select-selection-item`. Confirm the failure is in the `getMultipleValue`/`getSingleValue` assertions specifically (Task 9's rewritten selectors should already fix this — if `testUtils.ts` was edited in Task 9 before this step, this run should actually PASS immediately; if it still fails, inspect the actual rendered DOM via the test's failure output/screenshot and adjust the selector in Task 9 to match reality rather than the assumed antd class name).

- [ ] **Step 3: Fix `Simple.spec.tsx` if it makes assumptions about menu behavior**

The spec's `scroll(screen, 500)` sets `scrollTop` directly on `getMenu(screen)` (the `role="listbox"` element). Confirm this is still the actual scrollable element in antd's rendered dropdown, not a virtualization wrapper — since Task 7 sets `virtual={false}` by default, antd should render a plain scrollable list with `role="listbox"` as the scroll container (rc-select without virtualization renders `.rc-virtual-list-holder` as a plain overflow div even with `virtual={false}`, and that div is what carries `role="listbox"`... or the role may be on a parent). If `scroll()` doesn't trigger `onPopupScroll`, update `scroll()` in `testUtils.ts` to dispatch a real `scroll` event after setting `scrollTop`, since React's synthetic scroll listener needs the native event to fire (setting the property should trigger a native `scroll` event in Chromium automatically, but confirm empirically rather than assume):

```ts
export async function scroll(screen: RenderResult, position: number) {
	const menu = unwrap(getMenu(screen).query()) as HTMLElement;

	menu.scrollTop = position;
	menu.dispatchEvent(new Event("scroll", { bubbles: true }));
}
```

Apply this change to `testUtils.ts` (Task 9's file) only if the plain `scrollTop =` assignment doesn't fire antd's `onPopupScroll` in practice.

- [ ] **Step 4: Run the spec until it passes**

Run: `cd packages/react-select-async-paginate && bunx vitest run __stories__/Simple/Simple.spec.tsx --browser.headless`
Expected: PASS, both the "Single" and "Multiple" tests.

- [ ] **Step 5: Commit (bundles Task 9 + this task)**

```bash
git add packages/react-select-async-paginate/__stories__/testUtils.ts packages/react-select-async-paginate/__stories__/Simple/Simple.tsx
git commit -m "feat: migrate testUtils and Simple story to antd Select DOM"
```

---

## Task 12: Apply the same mechanical migration to the remaining "plain pattern" stories

**Files (react-select-async-paginate, all follow the identical `Simple.tsx` transformation):**
- Modify: `__stories__/ShowSelectedOnTop/ShowSelectedOnTop.tsx`
- Modify: `__stories__/Debounce/Debounce.tsx`
- Modify: `__stories__/GroupedOptions/GroupedOptions.tsx`
- Modify: `__stories__/PreventLoadOnMenuOpen/PreventLoadOnMenuOpen.tsx`
- Modify: `__stories__/RequestByPageNumber/RequestByPageNumber.tsx`
- Modify: `__stories__/ClearCacheOnMenuClose/ClearCacheOnMenuClose.tsx`
- Modify: `__stories__/ClearCacheOnSearchChange/ClearCacheOnSearchChange.tsx`
- Modify: `__stories__/Autoload/Autoload.tsx`
- Modify: `__stories__/InitialOptions/InitialOptions.tsx`
- Modify: `__stories__/ReloadOnError/ReloadOnError.tsx`
- Modify: `__stories__/CustomScrollCheck/CustomScrollCheck.tsx`

**Interfaces:**
- Same as Task 11 — no new interfaces, this is the same transformation applied to 11 more files.

- [ ] **Step 1: Apply the exact transformation from Task 11 to each file**

For each file listed above:
1. Replace `import type { GroupBase, MultiValue } from "react-select";` with `import type { GroupBase } from "../../src";` (drop the import entirely if the file doesn't otherwise use `GroupBase` — check first; e.g. `GroupedOptions.tsx` imports only `MultiValue`, no `GroupBase`, since it defines its own `GroupType` locally — in that case just delete the react-select import line).
2. Replace every occurrence of `OptionType | MultiValue<OptionType> | null` with `OptionType | OptionType[] | null` in the `useState` type parameter.
3. Leave all other logic (loadOptions, additional page-tracking, `shouldLoadMore` overrides, `clearCacheOnSearchChange`/`clearCacheOnMenuClose` props, etc.) untouched — none of it is react-select-specific.

- [ ] **Step 2: Run each corresponding spec after each file's edit**

Run: `cd packages/react-select-async-paginate && bunx vitest run __stories__/ShowSelectedOnTop __stories__/Debounce __stories__/GroupedOptions __stories__/PreventLoadOnMenuOpen __stories__/RequestByPageNumber __stories__/ClearCacheOnMenuClose __stories__/ClearCacheOnSearchChange __stories__/Autoload __stories__/InitialOptions __stories__/ReloadOnError __stories__/CustomScrollCheck --browser.headless`
Expected: PASS for all. If any `.spec.tsx` itself imports `MultiValue`/`GroupBase` from `react-select` directly (check each — `Simple.spec.tsx` didn't, confirm the others don't either since specs use `testUtils` helpers, not react-select types directly), apply the same import fix to the spec file too.

- [ ] **Step 3: Commit**

```bash
git add packages/react-select-async-paginate/__stories__/ShowSelectedOnTop packages/react-select-async-paginate/__stories__/Debounce packages/react-select-async-paginate/__stories__/GroupedOptions packages/react-select-async-paginate/__stories__/PreventLoadOnMenuOpen packages/react-select-async-paginate/__stories__/RequestByPageNumber packages/react-select-async-paginate/__stories__/ClearCacheOnMenuClose packages/react-select-async-paginate/__stories__/ClearCacheOnSearchChange packages/react-select-async-paginate/__stories__/Autoload packages/react-select-async-paginate/__stories__/InitialOptions packages/react-select-async-paginate/__stories__/ReloadOnError packages/react-select-async-paginate/__stories__/CustomScrollCheck
git commit -m "feat: migrate remaining plain-pattern stories to antd Select"
```

---

## Task 13: Migrate `Manual` and `MenuPlacement` stories (need behavioral adaptation, not just types)

**Files:**
- Modify: `packages/react-select-async-paginate/__stories__/Manual/Manual.tsx`
- Modify: `packages/react-select-async-paginate/__stories__/MenuPlacement/MenuPlacement.tsx`

**Interfaces:**
- Same as Task 11's `AsyncPaginate`/`GroupBase` — plus antd's `open`/`onOpenChange` (replacing react-select's `menuIsOpen`, already wired inside `withAsyncPaginate.tsx` in Task 7, so these stories don't need to know about `open` directly — they still just pass `menuIsOpen`/`onMenuOpen`/`onMenuClose` as public props) and antd's `placement` (replacing `menuPlacement`).

- [ ] **Step 1: Read `Manual.tsx` before editing**

This story wasn't fully read during planning — before editing, read `packages/react-select-async-paginate/__stories__/Manual/Manual.tsx` to see exactly what react-select-specific props/types it manually controls (likely `inputValue`/`menuIsOpen` controlled state, buttons to open/close). Apply the same `GroupBase`/`MultiValue` → local-type transformation from Task 12. If it references `InputActionMeta` (react-select-fetch's `Manual.tsx` does, per the earlier grep), remove that type entirely — `onInputChange` no longer takes a second argument (Task 6).

- [ ] **Step 2: Update `MenuPlacement.tsx`**

Change the `menuPlacement="auto"` prop to antd's equivalent. antd's `Select` doesn't support `"auto"` placement (it only supports `bottomLeft | bottomRight | topLeft | topRight`, no dynamic flip-based-on-viewport-space mode) — update the story to demonstrate `placement="topLeft"` instead, and change the story's description text (if any) to stop claiming "auto" behavior. Apply the same `GroupBase`/`MultiValue` transformation from Task 12 to the rest of the file.

- [ ] **Step 3: Run both specs**

Run: `cd packages/react-select-async-paginate && bunx vitest run __stories__/Manual __stories__/MenuPlacement --browser.headless`
Expected: PASS. If `MenuPlacement.spec.tsx` asserts on `menuPlacement="auto"` flip behavior specifically (e.g., checking the menu renders above the input near the viewport bottom), that assertion needs rewriting to check the now-static `placement="topLeft"` renders above the input — read the spec file first to see what it actually asserts before deciding.

- [ ] **Step 4: Commit**

```bash
git add packages/react-select-async-paginate/__stories__/Manual packages/react-select-async-paginate/__stories__/MenuPlacement
git commit -m "feat: migrate Manual and MenuPlacement stories, adapt placement API"
```

---

## Task 14: Replace `Creatable`/`CreatableWithNewOptions` stories with a DIY antd pattern

**Files:**
- Modify: `packages/react-select-async-paginate/__stories__/Creatable/Creatable.tsx`
- Modify: `packages/react-select-async-paginate/__stories__/CreatableWithNewOptions/CreatableWithNewOptions.tsx`

**Interfaces:**
- Consumes: `AsyncPaginate`, `LoadOptions` from `../../src`.
- Produces: no new library API — this is a story-local pattern only, per the "Known scope reduction" note at the top of this plan.

- [ ] **Step 1: Read both story files' specs before rewriting**

Read `packages/react-select-async-paginate/__stories__/Creatable/Creatable.spec.tsx` and `CreatableWithNewOptions/CreatableWithNewOptions.spec.tsx` (not read during planning) to know exactly what user flow they assert on (likely: type a value not in the list, see a "Create ..." option, click it, see it become the selected value).

- [ ] **Step 2: Rewrite `CreatableWithNewOptions.tsx` using a synthetic "create" option**

Replace the `react-select/creatable` import and `AsyncPaginateCreatable` wrapper with plain `AsyncPaginate`, injecting a synthetic option when `inputValue` doesn't match any existing option and appending it to the options list passed to render (not to the cache):

```tsx
import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import type { LoadOptions } from "../../src";
import { AsyncPaginate } from "../../src";
import type { StoryProps } from "../types";

type CreatableWithNewOptionsProps = StoryProps & {
	loadOptions?: LoadOptions<OptionType, never, null>;
};

type OptionType = {
	value: number | string;
	label: string;
};

const options: OptionType[] = [];
for (let i = 0; i < 50; ++i) {
	options.push({
		value: i + 1,
		label: `Option ${i + 1}`,
	});
}

export const loadOptions: LoadOptions<OptionType, never, null> = async (
	search,
	prevOptions,
) => {
	await new Promise((resolve) => setTimeout(resolve, 500));

	let filteredOptions: OptionType[];
	if (!search) {
		filteredOptions = options;
	} else {
		const searchLower = search.toLowerCase();

		filteredOptions = options.filter(({ label }) =>
			label.toLowerCase().includes(searchLower),
		);
	}

	const hasMore = filteredOptions.length > prevOptions.length + 10;
	const slicedOptions = filteredOptions.slice(
		prevOptions.length,
		prevOptions.length + 10,
	);

	return {
		options: slicedOptions,
		hasMore,
	};
};

const addNewOption = async (inputValue: string): Promise<OptionType> => {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const newOption = {
		label: inputValue,
		value: inputValue,
	};

	options.push(newOption);

	return newOption;
};

const increaseUniq = (uniq: number): number => uniq + 1;

export function CreatableWithNewOptions(
	props: CreatableWithNewOptionsProps,
): ReactElement {
	const [cacheUniq, setCacheUniq] = useState(0);
	const [isAddingInProgress, setIsAddingInProgress] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [value, onChange] = useState<OptionType | OptionType[] | null>(null);

	const onCreateOption = useCallback(async () => {
		setIsAddingInProgress(true);

		const newOption = await addNewOption(inputValue);

		setIsAddingInProgress(false);
		setCacheUniq(increaseUniq);
		setInputValue("");
		onChange(newOption);
	}, [inputValue]);

	const loadOptionsHandler = props?.loadOptions || loadOptions;

	const exactMatchExists = options.some(
		(option) => option.label.toLowerCase() === inputValue.toLowerCase(),
	);
	const showCreateAffordance = inputValue.length > 0 && !exactMatchExists;

	return (
		<>
			<div style={{ maxWidth: 300 }}>
				<AsyncPaginate
					{...props}
					disabled={isAddingInProgress}
					value={value}
					inputValue={inputValue}
					onInputChange={setInputValue}
					loadOptions={loadOptionsHandler}
					onChange={onChange}
					cacheUniqs={[cacheUniq]}
					notFoundContent={
						showCreateAffordance ? (
							// biome-ignore lint/a11y/useKeyWithClickEvents: story-only demo affordance
							<div onClick={onCreateOption} style={{ cursor: "pointer" }}>
								Create "{inputValue}"
							</div>
						) : undefined
					}
				/>
			</div>

			<p>Current value is {JSON.stringify(value)}</p>
		</>
	);
}
```

This is a demo-only pattern (documented as such in the "Known scope reduction" section) — it doesn't attempt to fully replicate react-select's `Creatable` (e.g., no keyboard-navigable "create" row inside the options list itself, since antd doesn't expose a way to inject a non-selectable row into the options array without it being a selectable option). Apply the equivalent pattern to `Creatable.tsx` (same idea, without the async `addNewOption` — check that file's actual content before assuming it's simpler; it wasn't read during planning).

- [ ] **Step 3: Read and adapt `Creatable.tsx`**

Read `packages/react-select-async-paginate/__stories__/Creatable/Creatable.tsx` in full, then apply the same `notFoundContent`-driven pattern from Step 2, scaled down to whatever that story actually demonstrates (likely a simpler synchronous create, without the `isAddingInProgress` state).

- [ ] **Step 4: Update the specs to match the new interaction**

The old specs almost certainly click a `role="option"` labeled `Create "..."` (react-select's `Creatable` renders the create affordance as a real option in the listbox). The new pattern renders it via `notFoundContent`, which is **not** a `role="option"` element — update `getMenuOption`-based assertions in these two specs to instead query the "Create ..." text directly (e.g., `screen.getByText(/^Create /)`) and click that. Read each spec, adapt its assertions accordingly, and run:

Run: `cd packages/react-select-async-paginate && bunx vitest run __stories__/Creatable __stories__/CreatableWithNewOptions --browser.headless`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/react-select-async-paginate/__stories__/Creatable packages/react-select-async-paginate/__stories__/CreatableWithNewOptions
git commit -m "feat: replace react-select Creatable stories with antd notFoundContent DIY pattern"
```

---

## Task 15: Migrate `antd-select-fetch`'s core `src/` files

**Files:**
- Modify: `packages/react-select-fetch/src/types.ts`
- Modify: `packages/react-select-fetch/src/useMapToAsyncPaginate.ts`
- Modify: `packages/react-select-fetch/src/useSelectFetchBase.ts`
- Modify: `packages/react-select-fetch/src/useSelectFetch.ts`
- Modify: `packages/react-select-fetch/src/withSelectFetch.tsx`
- Modify: `packages/react-select-fetch/src/index.ts`

**Interfaces:**
- Consumes: `GroupBase`, `OptionsOrGroups`, `Response`, `LoadOptions`, `UseAsyncPaginateParams`, `UseAsyncPaginateBaseParams`, `UseAsyncPaginateResult`, `UseAsyncPaginateBaseResult`, `ComponentProps`, `checkIsResponse`, `useAsyncPaginate`, `useAsyncPaginateBase`, `AsyncPaginateProps`, `WithAsyncPaginateType` — all now from `antd-select-async-paginate` (formerly `react-select-async-paginate`) instead of from `react-select` + `react-select-async-paginate` split across two packages.

- [ ] **Step 1: Update `types.ts`**

Replace the react-select import:

```ts
import type {
	GroupBase,
	OptionsOrGroups,
	Props as SelectProps,
} from "react-select";
```

with:

```ts
import type { GroupBase, OptionsOrGroups } from "react-select-async-paginate";
```

(package rename to `antd-select-async-paginate` happens in Task 17 — keep importing from `react-select-async-paginate` until then, since that's still the installed package name at this point in the plan). Remove `SelectProps` entirely — it was only used to build `SelectFetchProps`, which should instead extend `AsyncPaginateProps` directly:

```ts
import type { ReactElement } from "react";
import type {
	AsyncPaginateProps,
	ComponentProps,
	GroupBase,
	OptionsOrGroups,
	Response,
	UseAsyncPaginateBaseParams,
	UseAsyncPaginateParams,
} from "react-select-async-paginate";

export type Additional = {
	page: number;
};

export type MapResponsePayload<
	OptionType,
	Group extends GroupBase<OptionType>,
> = {
	search: string;
	prevPage: number;
	prevOptions: OptionsOrGroups<OptionType, Group>;
};

export type MapResponse<OptionType, Group extends GroupBase<OptionType>> = (
	responseRaw: unknown,
	payload: MapResponsePayload<OptionType, Group>,
) => Response<OptionType, Group, Additional>;

export type Get = <Response>(
	url: string,
	params: {
		[key: string]: unknown;
	},
) => Promise<Response>;

export type UseSelectFetchMapParams<
	OptionType,
	Group extends GroupBase<OptionType>,
> = {
	url: string;
	queryParams?: {
		[key: string]: unknown;
	};
	searchParamName?: string | null;
	pageParamName?: string | null;
	offsetParamName?: string | null;
	mapResponse?: MapResponse<OptionType, Group>;
	get?: Get;
	initialPage?: number;
	defaultInitialPage?: number;
};

export type UseSelectFetchParams<
	OptionType,
	Group extends GroupBase<OptionType>,
> = UseSelectFetchMapParams<OptionType, Group> &
	Partial<UseAsyncPaginateParams<OptionType, Group, Additional>>;

export type UseSelectFetchBaseParams<
	OptionType,
	Group extends GroupBase<OptionType>,
> = UseSelectFetchParams<OptionType, Group> &
	Partial<UseAsyncPaginateBaseParams<OptionType, Group, Additional>> & {
		inputValue: string;
		menuIsOpen: boolean;
	};

export type SelectFetchProps<
	OptionType,
	Group extends GroupBase<OptionType>,
	IsMulti extends boolean,
> = Omit<
	AsyncPaginateProps<OptionType, Group, Additional, IsMulti>,
	"loadOptions"
> &
	UseSelectFetchParams<OptionType, Group> &
	ComponentProps<OptionType>;

export type SelectFetchType = <
	OptionType,
	Group extends GroupBase<OptionType>,
	IsMulti extends boolean = false,
>(
	props: SelectFetchProps<OptionType, Group, IsMulti>,
) => ReactElement;
```

- [ ] **Step 2: Update `useMapToAsyncPaginate.ts`, `useSelectFetchBase.ts`, `useSelectFetch.ts`**

In all three, replace:

```ts
import type { GroupBase } from "react-select";
```

with removing that line entirely — `GroupBase` in these files should now come from the same `react-select-async-paginate` import already present on the next line (merge the two import statements). For example in `useSelectFetchBase.ts`:

```ts
import type {
	GroupBase,
	UseAsyncPaginateBaseResult,
} from "react-select-async-paginate";
import { useAsyncPaginateBase } from "react-select-async-paginate";
import type { UseSelectFetchBaseParams } from "./types";
import { useMapToAsyncPaginate } from "./useMapToAsyncPaginate";
```

Apply the equivalent merge to `useSelectFetch.ts` (merging `GroupBase` into the existing `react-select-async-paginate` type import alongside `UseAsyncPaginateResult`) and `useMapToAsyncPaginate.ts` (merging `GroupBase` into the existing import alongside `LoadOptions`, `UseAsyncPaginateParams`).

- [ ] **Step 3: Rewrite `withSelectFetch.tsx`**

```tsx
import type { Select as AntdSelect } from "antd";
import type { ReactElement } from "react";
import type { UseAsyncPaginateResult } from "react-select-async-paginate";
import type { GroupBase } from "react-select-async-paginate";
import type { SelectFetchProps, SelectFetchType } from "./types";
import { useSelectFetch } from "./useSelectFetch";

const defaultCacheUniqs: unknown[] = [];

export function withSelectFetch(
	SelectComponent: typeof AntdSelect,
): SelectFetchType {
	function WithSelectFetch<
		OptionType,
		Group extends GroupBase<OptionType>,
		IsMulti extends boolean = false,
	>(props: SelectFetchProps<OptionType, Group, IsMulti>): ReactElement {
		const { selectRef = undefined, cacheUniqs = defaultCacheUniqs, ...rest } =
			props;

		const asyncPaginateProps: UseAsyncPaginateResult<OptionType, Group> =
			useSelectFetch(rest, cacheUniqs);

		return (
			<SelectComponent
				{...(rest as object)}
				{...(asyncPaginateProps as object)}
				ref={selectRef as never}
			/>
		);
	}

	return WithSelectFetch;
}
```

Note this is intentionally thinner than `withAsyncPaginate.tsx` — all the antd-specific wiring (`onSearch`, `onPopupScroll`, `onChange` translation, `filterOption`, `virtual`) already lives in `useAsyncPaginate`'s consumer, `withAsyncPaginate.tsx`. But `withSelectFetch` renders `SelectComponent` directly (antd's `Select`), not `AsyncPaginate` — so it needs the **same** wiring `withAsyncPaginate.tsx` has, not a shortcut. Correct this: `withSelectFetch.tsx` must duplicate the `onChange`/`onSearch`/`onOpenChange`/`onPopupScroll`/`filterOption`/`loading`/`virtual` wiring from Task 7's `withAsyncPaginate.tsx`, since `asyncPaginateProps` here is the same-shaped `UseAsyncPaginateResult` that `withAsyncPaginate.tsx` also consumes. Use this corrected version instead of the snippet above:

```tsx
import type { GetProp, Select as AntdSelect } from "antd";
import type { ReactElement } from "react";
import { useCallback } from "react";
import type {
	GroupBase,
	UseAsyncPaginateResult,
} from "react-select-async-paginate";
import type { SelectFetchProps, SelectFetchType } from "./types";
import { useSelectFetch } from "./useSelectFetch";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;

export function withSelectFetch(
	SelectComponent: typeof AntdSelect,
): SelectFetchType {
	function WithSelectFetch<
		OptionType,
		Group extends GroupBase<OptionType>,
		IsMulti extends boolean = false,
	>(props: SelectFetchProps<OptionType, Group, IsMulti>): ReactElement {
		const {
			selectRef = undefined,
			cacheUniqs = defaultCacheUniqs,
			loading: isLoadingProp,
			virtual = false,
			onChange,
			...rest
		} = props;

		const asyncPaginateProps: UseAsyncPaginateResult<OptionType, Group> =
			useSelectFetch(rest, cacheUniqs);

		const isLoading =
			typeof isLoadingProp === "boolean"
				? isLoadingProp
				: asyncPaginateProps.isLoading;

		const handleChange = useCallback<AntdOnChange>(
			(_value, option) => {
				onChange?.(option as never);
			},
			[onChange],
		);

		return (
			<SelectComponent
				{...(rest as object)}
				options={asyncPaginateProps.options as never}
				searchValue={asyncPaginateProps.inputValue}
				onSearch={asyncPaginateProps.onInputChange}
				open={asyncPaginateProps.menuIsOpen}
				onOpenChange={(open) => {
					if (open) {
						asyncPaginateProps.onMenuOpen();
					} else {
						asyncPaginateProps.onMenuClose();
					}
				}}
				onPopupScroll={asyncPaginateProps.handlePopupScroll}
				filterOption={asyncPaginateProps.filterOption}
				loading={isLoading}
				virtual={virtual}
				onChange={handleChange}
				ref={selectRef as never}
			/>
		);
	}

	return WithSelectFetch;
}
```

- [ ] **Step 4: Update `index.ts`**

```ts
import { Select } from "antd";
import { withSelectFetch } from "./withSelectFetch";

export { withSelectFetch };

export { useMapToAsyncPaginate } from "./useMapToAsyncPaginate";
export { useSelectFetch } from "./useSelectFetch";
export { useSelectFetchBase } from "./useSelectFetchBase";

export const SelectFetch = withSelectFetch(Select);

export * from "./types";
```

- [ ] **Step 5: Run `test:ts` and unit tests**

Run: `cd packages/react-select-fetch && bun run test:ts`
Expected: PASS for `src/` (stories fixed in Task 16).

Run: `cd packages/react-select-fetch && bunx vitest run src --browser.headless`
Expected: PASS (`get.test.ts`, `index.test.ts`, `stringifyParams.test.ts` don't touch antd at all).

- [ ] **Step 6: Commit**

```bash
git add packages/react-select-fetch/src
git commit -m "feat: migrate react-select-fetch core to antd Select"
```

---

## Task 16: Migrate `antd-select-fetch`'s stories

**Files:**
- Modify: `packages/react-select-fetch/__stories__/Simple/Simple.tsx`
- Modify: `packages/react-select-fetch/__stories__/InitialOptions/InitialOptions.tsx`
- Modify: `packages/react-select-fetch/__stories__/Manual/Manual.tsx`
- Modify: `packages/react-select-fetch/__stories__/ReloadOnError/ReloadOnError.tsx`
- Modify: `packages/react-select-fetch/__stories__/CreatableWithNewOptions/CreatableWithNewOptions.tsx`
- Modify: `packages/react-select-fetch/__stories__/testUtils.ts` (if this package has its own copy — verify; if it imports from the sibling package's `__stories__/testUtils.ts` via a relative path, update that path instead)

**Interfaces:**
- Same as Task 12/13/14, applied to this package's stories.

- [ ] **Step 1: Check whether `react-select-fetch/__stories__` has its own `testUtils.ts` or imports the sibling package's**

Run: `ls packages/react-select-fetch/__stories__` (already known from earlier exploration: this package's stories directly under `__stories__/Simple/`, `__stories__/ReloadOnError/`, etc. — same layout as the other package, so it likely has its own `testUtils.ts` copy, not a cross-package import, since Bun workspaces don't expose `__stories__` outside `src`/`dist`). If it has its own copy, apply the exact same `getSingleValue`/`getMultipleValue` fix from Task 9 to this copy too.

- [ ] **Step 2: Apply the plain-pattern transformation (Task 12's rule) to `Simple.tsx`, `InitialOptions.tsx`, `ReloadOnError.tsx`**

Same rule: drop `import type { MultiValue } from "react-select"`, change `OptionType | MultiValue<OptionType> | null` to `OptionType | OptionType[] | null`.

- [ ] **Step 3: Read and adapt `Manual.tsx`**

This file imports `InputAction, InputActionMeta, MultiValue` from `react-select` (per the earlier grep) — read it in full before editing, since it likely manually calls `onInputChange` with an `actionMeta` argument that no longer exists (Task 6 dropped the second parameter). Remove the `actionMeta`/`InputAction`/`InputActionMeta` usage entirely, calling `onInputChange(newValue)` with just the string.

- [ ] **Step 4: Apply the Task 14 DIY-creatable pattern to `CreatableWithNewOptions.tsx`**

Read this file in full (it wasn't read during planning), then apply the same `notFoundContent`-based pattern from Task 14, adapted to this story's actual `loadOptions`/`onCreateOption` wiring (it uses `react-select-async-paginate`'s `ComponentProps` type per the earlier grep — update that import to the antd-based `ComponentProps` from Task 1, which now only takes one generic parameter `ComponentProps<OptionType>` instead of three).

- [ ] **Step 5: Run all `react-select-fetch` story specs**

Run: `cd packages/react-select-fetch && bunx vitest run __stories__ --browser.headless`
Expected: PASS across all 5 story specs.

- [ ] **Step 6: Commit**

```bash
git add packages/react-select-fetch/__stories__
git commit -m "feat: migrate react-select-fetch stories to antd Select"
```

---

## Task 17: Rename both packages, reset versions to 0.1.0

**Files:**
- Rename directory: `packages/react-select-async-paginate/` → `packages/antd-select-async-paginate/`
- Rename directory: `packages/react-select-fetch/` → `packages/antd-select-fetch/`
- Modify: `packages/antd-select-async-paginate/package.json`
- Modify: `packages/antd-select-fetch/package.json`
- Modify: every file across both packages importing `from "react-select-async-paginate"` (only `antd-select-fetch/src/*` and its `__stories__` per Tasks 15–16).

**Interfaces:**
- Produces: npm package names `antd-select-async-paginate@0.1.0`, `antd-select-fetch@0.1.0`.

- [ ] **Step 1: Rename the directories with git, preserving history**

```bash
git mv packages/react-select-async-paginate packages/antd-select-async-paginate
git mv packages/react-select-fetch packages/antd-select-fetch
```

- [ ] **Step 2: Update `packages/antd-select-async-paginate/package.json`**

Change:

```json
  "name": "antd-select-async-paginate",
  "version": "0.1.0",
  "description": "Wrapper above antd Select that supports pagination on menu scroll",
```

Update `"keywords"` (replace `"react-select"` with `"antd"`), `"repository"` and `"homepage"` to point at `victorsoares96/antd-select-async-paginate`.

- [ ] **Step 3: Update `packages/antd-select-fetch/package.json`**

Change:

```json
  "name": "antd-select-fetch",
  "version": "0.1.0",
  "description": "Wrapper above antd-select-async-paginate that loads options from specified url",
```

Update `"keywords"`, `"repository"`/`"homepage"`, and the peer/dev dependency name from `react-select-async-paginate` to `antd-select-async-paginate` (already pointing at version `^0.1.0`/`0.1.0` per Task 2's edits — just fix the package name string itself).

- [ ] **Step 4: Update every import referencing the old package name**

Run: search for `"react-select-async-paginate"` across `packages/antd-select-fetch/src` and `packages/antd-select-fetch/__stories__` (Grep tool, pattern `react-select-async-paginate`) and replace each with `antd-select-async-paginate`.

- [ ] **Step 5: Reinstall to relink the renamed workspace package**

Run: `bun install`
Expected: `antd-select-fetch`'s dependency on `antd-select-async-paginate` resolves via the Bun workspace link, no errors.

- [ ] **Step 6: Run full validation**

Run: `bun run validate`
Expected: PASS — `bun run build && bun run test` (build, lint, test:ts, test:unit) across both renamed packages.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: rename packages to antd-select-async-paginate and antd-select-fetch, reset to 0.1.0"
```

---

## Task 18: Update READMEs and CHANGELOGs

**Files:**
- Modify: `README.md` (root)
- Modify: `packages/antd-select-async-paginate/README.md`
- Modify: `packages/antd-select-fetch/README.md`
- Modify: `packages/antd-select-async-paginate/CHANGELOG.md`
- Modify: `packages/antd-select-fetch/CHANGELOG.md`

**Interfaces:**
- None — documentation only.

- [ ] **Step 1: Update root `README.md`**

Replace the two package links/descriptions to reference `antd-select-async-paginate`/`antd-select-fetch`, and change "wrapper above `react-select`" to "wrapper above antd's `Select`".

- [ ] **Step 2: Rewrite `packages/antd-select-async-paginate/README.md`**

Read the current file in full first (it's 9130 bytes — likely has a props table and usage examples using `react-select` value shapes). Update every code example to import `antd` instead of `react-select`, and update the props table for the API differences from this plan: `filterOption` signature (`(inputValue, option) => boolean`, default `false`), no more `menuPlacement`/`menuShouldScrollIntoView` (mention `placement` instead), `onInputChange(value: string)` (no action meta), `fieldNames` for custom label/value keys.

- [ ] **Step 3: Rewrite `packages/antd-select-fetch/README.md`**

Read the current file in full, apply the equivalent updates.

- [ ] **Step 4: Prepend a new entry to both CHANGELOGs**

For `packages/antd-select-async-paginate/CHANGELOG.md`, prepend:

```markdown
# 0.1.0

Renamed from `react-select-async-paginate`. Replaced `react-select` with antd's `Select` as the underlying component. See the historical changelog for `react-select-async-paginate` at https://github.com/vtaits/react-select-async-paginate/blob/master/packages/react-select-async-paginate/CHANGELOG.md.

Breaking changes versus the last `react-select-async-paginate` release:
- Peer dependency is now `antd ^5` instead of `react-select ^5`.
- `filterOption` signature changed to antd's `(inputValue, option) => boolean`, default `false` (was `null`).
- `onInputChange` no longer receives a second `actionMeta` argument.
- `menuPlacement`/`menuShouldScrollIntoView` removed — use antd's `placement` prop.
- Custom option label/value field names use antd's `fieldNames` prop instead of `getOptionLabel`/`getOptionValue`.
- `value`/`onChange` still always carry the full option object (unchanged contract).

```

Apply the equivalent entry to `packages/antd-select-fetch/CHANGELOG.md`, referencing `react-select-fetch`'s historical changelog instead.

- [ ] **Step 5: Commit**

```bash
git add README.md packages/antd-select-async-paginate/README.md packages/antd-select-fetch/README.md packages/antd-select-async-paginate/CHANGELOG.md packages/antd-select-fetch/CHANGELOG.md
git commit -m "docs: update READMEs and changelogs for the antd Select migration"
```

---

## Task 19: Final full validation

**Files:** none (verification only).

- [ ] **Step 1: Run the complete validation suite from the repo root**

Run: `bun run validate`
Expected: PASS — this runs `build` (tsup for both packages) then `test` (`lint` via Biome, `test:ts` via tsc, `test:unit` via Vitest browser mode with coverage) across both packages.

- [ ] **Step 2: Manually smoke-test via Storybook**

Run: `bun run start`
Expected: Storybook boots on port 6006. Open a few stories (`Simple`, `GroupedOptions`, `CreatableWithNewOptions`, `Manual`) in the browser and confirm: typing filters/loads options, scrolling the dropdown loads more pages, selecting an option updates the displayed value, multi-select shows tags. This is the step where any antd rendering quirk not caught by the headless Vitest specs (visual glitches, unexpected `notFoundContent` flashing, `virtual={false}` performance with large option lists) would surface — do this before declaring the migration done.

- [ ] **Step 3: Fix any drift found in Steps 1–2**

If anything fails, return to the relevant task above, fix it there (not with an ad-hoc patch here), and re-run Step 1.

---

## Task 20: Reset git history and force-push (DESTRUCTIVE — requires fresh explicit confirmation)

**Files:** none (git operations only).

**⚠️ Do not run this task's steps without asking the user to explicitly confirm again, immediately before Step 2, even though it was discussed and agreed to during planning.** This rewrites the public history of `victorsoares96/antd-select-async-paginate` on GitHub — irreversible for anyone who has already fetched the old history, and undoable locally only if a backup ref is kept (Step 1 makes one).

- [ ] **Step 1: Back up the current history locally before doing anything destructive**

```bash
git branch backup/pre-antd-history-reset
```

Expected: a local branch pointing at the current tip exists, so the full old history remains recoverable locally even after the reset.

- [ ] **Step 2: Confirm with the user**

Stop here and ask: "About to delete `.git` history and force-push a single fresh commit to `https://github.com/victorsoares96/antd-select-async-paginate`, permanently overwriting the remote's commit history. A local backup branch `backup/pre-antd-history-reset` will remain. Proceed?" Do not continue to Step 3 without an explicit yes in this session.

- [ ] **Step 3: Reset local git history**

```bash
rm -rf .git
git init
git remote add origin https://github.com/victorsoares96/antd-select-async-paginate.git
git add -A
git commit -m "feat: antd-select-async-paginate — pagination-aware wrapper around antd Select

Forked from react-select-async-paginate (https://github.com/vtaits/react-select-async-paginate), rebuilt on top of antd's Select instead of react-select."
```

- [ ] **Step 4: Force-push**

```bash
git push --force origin master
```

Expected: the GitHub repo now shows a single commit as its entire history.

- [ ] **Step 5: Verify**

Run: `git log --oneline` (expect exactly one commit) and check the GitHub repo page in a browser to confirm the push landed and Actions/branch protection (if any) didn't block it.

---

## Self-Review Notes

- **Spec coverage:** every decision from the grill session (P1–P12) maps to a task: antd Select target → Tasks 7–8, 15; in-place rewrite scope → all tasks; antd v5 → Task 2; `onPopupScroll` → Tasks 4–5, 7, 15; generic `OptionType` via `fieldNames` → Task 1 (types), Task 7 (prop passthrough — `fieldNames` flows through via `{...rest}` since it's not destructured out); package renames → Task 17; value/onChange full-object contract → Tasks 1, 7, 15; version reset → Task 17; new-repo-from-fork framing → Task 20; branch-first sequencing → implicit in task ordering (all work happens as normal commits, reset is the last task).
- **Gap surfaced, not silently dropped:** `Creatable` support has no antd equivalent — flagged at the top of the plan and in Task 14 as a scoped-down DIY pattern, not a silent omission.
- **Type consistency check:** `handleScrolledToBottom` renamed to `handlePopupScroll` consistently across Task 1 (type), Task 5 (implementation), Task 7 and Task 15 Step 3 (consumption). `onInputChange` signature (`(newValue: string) => void`, no second argument) consistent across Task 1, Task 6, Task 7, Task 13, Task 16. `ComponentProps<OptionType>` (single generic, was `ComponentProps<OptionType, Group, IsMulti>`) consistent across Task 1 and Task 15's `types.ts` rewrite — double-check Task 16 Step 4 explicitly calls this out for `CreatableWithNewOptions.tsx`.
