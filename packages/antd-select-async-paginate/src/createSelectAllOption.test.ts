import { describe, expect, test } from "vitest";
import { createSelectAllOption } from "./createSelectAllOption";

describe("createSelectAllOption", () => {
	test("builds the unfiltered option when inputValue is empty", () => {
		const selectAllOption = createSelectAllOption({
			value: "__all__",
			label: "Todos",
			searchLabel: (search) => `Todos com o termo: "${search}"`,
		});

		expect(selectAllOption("")).toEqual({ value: "__all__", label: "Todos" });
	});

	test("builds a search-scoped option with a distinct value when inputValue is set", () => {
		const selectAllOption = createSelectAllOption({
			value: "__all__",
			label: "Todos",
			searchLabel: (search) => `Todos com o termo: "${search}"`,
		});

		expect(selectAllOption("abc")).toEqual({
			value: "__all__:abc",
			label: 'Todos com o termo: "abc"',
		});
	});

	test("isSelectAllOption matches both the unfiltered and search-scoped values", () => {
		const selectAllOption = createSelectAllOption({
			value: "__all__",
			label: "Todos",
			searchLabel: (search) => `Todos com o termo: "${search}"`,
		});

		expect(selectAllOption.isSelectAllOption({ value: "__all__" })).toBe(true);
		expect(selectAllOption.isSelectAllOption({ value: "__all__:abc" })).toBe(
			true,
		);
		expect(selectAllOption.isSelectAllOption({ value: "option-1" })).toBe(
			false,
		);
		expect(
			selectAllOption.isSelectAllOption({ value: "__all__not-a-match" }),
		).toBe(false);
	});
});
