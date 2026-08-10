import { describe, expect, test } from "vitest";
import { resolveSelectAllChange } from "./resolveSelectAllChange";

type OptionType = { value: string; label: string };

const isSelectAllOption = (option: OptionType) => option.value === "__all__";

const optionA: OptionType = { value: "a", label: "A" };
const optionB: OptionType = { value: "b", label: "B" };
const allOption: OptionType = { value: "__all__", label: "Todos" };

describe("resolveSelectAllChange", () => {
	test("selecting the select-all option drops every other selected option", () => {
		const result = resolveSelectAllChange(
			[optionA, optionB],
			[optionA, optionB, allOption],
			isSelectAllOption,
		);

		expect(result).toEqual([allOption]);
	});

	test("selecting an individual option while select-all is active drops select-all", () => {
		const result = resolveSelectAllChange(
			[allOption],
			[allOption, optionA],
			isSelectAllOption,
		);

		expect(result).toEqual([optionA]);
	});

	test("deselecting an individual option is unaffected", () => {
		const result = resolveSelectAllChange(
			[optionA, optionB],
			[optionA],
			isSelectAllOption,
		);

		expect(result).toEqual([optionA]);
	});

	test("passes through unchanged when select-all is not involved", () => {
		const result = resolveSelectAllChange(
			[optionA],
			[optionA, optionB],
			isSelectAllOption,
		);

		expect(result).toEqual([optionA, optionB]);
	});
});
