import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
	getInput,
	getMenu,
	getMenuOption,
	getMultipleValue,
	openMenu,
	type,
} from "../testUtils";
import { loadOptions, SelectAllOption } from "./SelectAllOption";

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
});
