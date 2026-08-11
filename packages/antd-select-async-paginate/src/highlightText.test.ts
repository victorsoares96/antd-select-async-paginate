import { describe, expect, test } from "vitest";
import { highlightText } from "./highlightText";

describe("highlightText", () => {
	test("returns the plain text when searchTerm is empty", () => {
		expect(highlightText("Option 1", "")).toBe("Option 1");
	});

	test("returns the plain text when there is no match", () => {
		expect(highlightText("Option 1", "xyz")).toBe("Option 1");
	});

	test("wraps the matched substring in a mark element", () => {
		const result = highlightText("Option 1", "opt") as unknown[];

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			type: "mark",
			props: { children: "Opt" },
		});
		expect(result[1]).toBe("ion 1");
	});

	test("matches case-insensitively", () => {
		const result = highlightText("OPTION 1", "option") as unknown[];

		expect(result[0]).toMatchObject({
			type: "mark",
			props: { children: "OPTION" },
		});
	});

	test("highlights every occurrence", () => {
		const result = highlightText("banana", "an") as unknown[];

		const marked = result.filter(
			(part): part is { type: string } =>
				typeof part === "object" && part !== null && "type" in part,
		);
		expect(marked).toHaveLength(2);
	});

	test("applies a custom className and style to the mark element", () => {
		const result = highlightText("Option 1", "opt", {
			className: "my-highlight",
			style: { color: "red" },
		}) as unknown[];

		expect(result[0]).toMatchObject({
			type: "mark",
			props: {
				className: "my-highlight",
				style: { color: "red" },
				children: "Opt",
			},
		});
	});
});
