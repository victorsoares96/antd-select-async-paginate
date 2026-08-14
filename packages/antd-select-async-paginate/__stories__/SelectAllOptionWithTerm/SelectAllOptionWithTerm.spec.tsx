import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
	getInput,
	getMenu,
	getMenuOption,
	getMultipleValue,
	openMenu,
} from "../testUtils";
import {
	loadOptions,
	SelectAllOptionWithTerm,
} from "./SelectAllOptionWithTerm";

describe("SelectAllOptionWithTerm", () => {
	test("shows the search-scoped select-all option for the default search term as soon as the menu opens", async () => {
		const loadOptionsProp = vi.fn(loadOptions);

		const screen = render(
			<SelectAllOptionWithTerm loadOptions={loadOptionsProp} />,
		);

		await openMenu(screen);

		await expect.element(getInput(screen)).toHaveValue("Option 1");

		const searchAllOption = getMenuOption(
			screen,
			'Todos com o termo: "Option 1"',
		);
		await expect.element(searchAllOption).toBeInTheDocument();

		await searchAllOption.click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual([
				'Todos com o termo: "Option 1"',
			]);
		});
	});

	test("selecting an individual option while the search-scoped select-all is active drops it", async () => {
		const screen = render(<SelectAllOptionWithTerm />);

		await openMenu(screen);

		await getMenuOption(screen, 'Todos com o termo: "Option 1"').click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual([
				'Todos com o termo: "Option 1"',
			]);
		});

		await expect.element(getMenu(screen)).toBeInTheDocument();

		await getMenuOption(screen, "Option 1").click();

		await vi.waitFor(() => {
			expect(getMultipleValue(screen)).toEqual(["Option 1"]);
		});
	});
});
