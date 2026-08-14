import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { GroupBase, LoadOptions } from "../../src";
import {
	getInput,
	getMenu,
	getMenuOption,
	getMultipleValue,
	openMenu,
	type,
} from "../testUtils";
import { loadOptions, SelectAllOption } from "./SelectAllOption";

type OptionType = { value: string; label: string };

const twoOptionsNoMore: LoadOptions<
	OptionType,
	GroupBase<OptionType>,
	unknown
> = async () => ({
	options: [
		{ value: "1", label: "Option 1" },
		{ value: "2", label: "Option 2" },
	],
	hasMore: false,
});

const sixOptionsPagedByThree: OptionType[] = Array.from(
	{ length: 6 },
	(_, index) => ({
		value: String(index + 1),
		label: `Option ${index + 1}`,
	}),
);

const threePerPage: LoadOptions<
	OptionType,
	GroupBase<OptionType>,
	unknown
> = async (_search, prevOptions) => {
	const slice = sixOptionsPagedByThree.slice(
		prevOptions.length,
		prevOptions.length + 3,
	);

	return {
		options: slice,
		hasMore: prevOptions.length + slice.length < sixOptionsPagedByThree.length,
	};
};

describe("SelectAllOption", () => {
	test("selecting Todos clears any individual selection, and vice-versa", async () => {
		const loadOptionsProp = vi.fn(loadOptions);

		const screen = render(<SelectAllOption loadOptions={loadOptionsProp} />);

		await openMenu(screen);

		await vi.waitFor(() => {
			expect(loadOptionsProp).toHaveBeenCalledTimes(1);
		});

		// "Todos" is pinned first, with no search active
		const todosOption = getMenuOption(screen, "Todos");
		await expect.element(todosOption).toBeInTheDocument();

		// Select an individual option first
		await getMenuOption(screen, "Option 1").click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual(["Option 1"]);
		});

		// Selecting "Todos" now should drop "Option 1"
		await getMenuOption(screen, "Todos").click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual(["Todos"]);
		});

		// Selecting an individual option while "Todos" is active drops "Todos"
		await getMenuOption(screen, "Option 2").click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual(["Option 2"]);
		});
	});

	test("searching swaps Todos for a search-scoped select-all option", async () => {
		const loadOptionsProp = vi.fn(loadOptions);

		const screen = render(<SelectAllOption loadOptions={loadOptionsProp} />);

		const input = getInput(screen);

		await type(screen, "Option 4");

		await expect.element(getMenu(screen)).toBeInTheDocument();
		await expect.element(input).toHaveValue("Option 4");

		const searchAllOption = getMenuOption(
			screen,
			'Todos com o termo: "Option 4"',
		);
		await expect.element(searchAllOption).toBeInTheDocument();

		await searchAllOption.click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual([
				'Todos com o termo: "Option 4"',
			]);
		});
	});

	test("hides Todos once every loaded option is selected and there's nothing left to load", async () => {
		const screen = render(<SelectAllOption loadOptions={twoOptionsNoMore} />);

		await openMenu(screen);

		await expect.element(getMenuOption(screen, "Todos")).toBeInTheDocument();

		await getMenuOption(screen, "Option 1").click();
		await getMenuOption(screen, "Option 2").click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual(["Option 1", "Option 2"]);
		});

		await expect
			.element(getMenuOption(screen, "Todos"))
			.not.toBeInTheDocument();
	});

	test("auto-loads the next page when hideSelectedOptions collapses the scrollable area", async () => {
		const screen = render(
			<SelectAllOption loadOptions={threePerPage} hideSelectedOptions />,
		);

		await openMenu(screen);

		await expect.element(getMenuOption(screen, "Option 3")).toBeInTheDocument();

		await getMenuOption(screen, "Option 1").click();
		await getMenuOption(screen, "Option 2").click();
		await getMenuOption(screen, "Option 3").click();

		// Page 2 should auto-load even without a manual scroll event: hiding
		// every option from page 1 collapses the scrollable area, so a real
		// scroll event would never fire on its own.
		await expect.element(getMenuOption(screen, "Option 4")).toBeInTheDocument();

		await getMenuOption(screen, "Option 4").click();
		await getMenuOption(screen, "Option 5").click();
		await getMenuOption(screen, "Option 6").click();

		await expect
			.element(getMenuOption(screen, "Todos"))
			.not.toBeInTheDocument();
	});
});
