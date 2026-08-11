import { unwrap } from "krustykrab";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { getMenu, openMenu, type } from "../testUtils";
import { HighlightSearchTerm, loadOptions } from "./HighlightSearchTerm";

describe("HighlightSearchTerm", () => {
	test("wraps the matched search term in a mark element", async () => {
		const loadOptionsProp = vi.fn(loadOptions);

		const screen = render(
			<HighlightSearchTerm loadOptions={loadOptionsProp} />,
		);

		await openMenu(screen);

		await vi.waitFor(() => {
			expect(loadOptionsProp).toHaveBeenCalledTimes(1);
		});

		await type(screen, "Option 4");

		await vi.waitFor(() => {
			expect(loadOptionsProp).toHaveBeenCalledWith("Option 4", [], undefined);
		});

		const listbox = getMenu(screen);
		const menuElement = unwrap(listbox.query()) as HTMLElement;
		const mark = menuElement.querySelector("mark");

		await expect.element(listbox).toBeInTheDocument();
		expect(mark).not.toBeNull();
		expect(mark?.textContent).toBe("Option 4");
	});

	test("shows plain labels when there is no active search", async () => {
		const loadOptionsProp = vi.fn(loadOptions);

		const screen = render(
			<HighlightSearchTerm loadOptions={loadOptionsProp} />,
		);

		await openMenu(screen);

		await vi.waitFor(() => {
			expect(loadOptionsProp).toHaveBeenCalledTimes(1);
		});

		const listbox = getMenu(screen);
		const menuElement = unwrap(listbox.query()) as HTMLElement;

		expect(menuElement.querySelector("mark")).toBeNull();
	});
});
