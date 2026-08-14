import { renderHook } from "@testing-library/react";
import type { UIEvent } from "react";
import { describe, expect, test, vi } from "vitest";
import type { UseAsyncPaginateBaseParams } from "./types";
import { useAsyncPaginateBase } from "./useAsyncPaginateBase";

type OptionType = { value: number; label: string };

const buildEvent = (
	scrollTop: number,
	scrollHeight: number,
	clientHeight: number,
) =>
	({
		currentTarget: { scrollTop, scrollHeight, clientHeight },
	}) as unknown as UIEvent<HTMLDivElement>;

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

describe("useAsyncPaginateBase hasMore", () => {
	test("exposes hasMore from the current cache entry", () => {
		const loadOptions = vi.fn();

		const params: UseAsyncPaginateBaseParams<OptionType, never, unknown> = {
			loadOptions,
			inputValue: "",
			menuIsOpen: false,
			defaultOptions: [{ value: 1, label: "One" }],
		};

		const { result } = renderHook(() => useAsyncPaginateBase(params));

		expect(result.current.hasMore).toBe(true);
	});

	test("reflects hasMore:false once loadOptions resolves with no more pages", async () => {
		const loadOptions = vi.fn().mockResolvedValue({
			options: [{ value: 2, label: "Two" }],
			hasMore: false,
		});

		const params: UseAsyncPaginateBaseParams<OptionType, never, unknown> = {
			loadOptions,
			inputValue: "",
			menuIsOpen: true,
			defaultOptions: true,
		};

		const { result } = renderHook(() => useAsyncPaginateBase(params));

		await vi.waitFor(() => {
			expect(result.current.hasMore).toBe(false);
		});
	});
});
