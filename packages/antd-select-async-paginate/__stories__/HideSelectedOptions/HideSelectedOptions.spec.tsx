import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { GroupBase, LoadOptions } from "../../src";
import { getMenuOption, getMultipleValue, openMenu } from "../testUtils";
import { HideSelectedOptions } from "./HideSelectedOptions";

type OptionType = { value: number; label: string };

const sixOptionsPagedByThree: OptionType[] = Array.from(
	{ length: 6 },
	(_, index) => ({
		value: index + 1,
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

describe("HideSelectedOptions", () => {
	test("hides each option from the menu as it gets selected, without removing it from the value", async () => {
		const screen = render(<HideSelectedOptions loadOptions={threePerPage} />);

		await openMenu(screen);

		await expect.element(getMenuOption(screen, "Option 1")).toBeInTheDocument();

		await getMenuOption(screen, "Option 1").click();

		await expect
			.element(getMenuOption(screen, "Option 1"))
			.not.toBeInTheDocument();

		expect(getMultipleValue(screen)).toEqual(["Option 1"]);
	});

	test("auto-loads the next page once every option from the current page is selected", async () => {
		const screen = render(<HideSelectedOptions loadOptions={threePerPage} />);

		await openMenu(screen);

		await expect.element(getMenuOption(screen, "Option 3")).toBeInTheDocument();

		await getMenuOption(screen, "Option 1").click();
		await getMenuOption(screen, "Option 2").click();
		await getMenuOption(screen, "Option 3").click();

		// Page 2 should auto-load even without a manual scroll event: hiding
		// every option from page 1 collapses the scrollable area, so a real
		// scroll event would never fire on its own.
		await expect.element(getMenuOption(screen, "Option 4")).toBeInTheDocument();

		expect(getMultipleValue(screen)).toEqual([
			"Option 1",
			"Option 2",
			"Option 3",
		]);
	});

	test("shows a placeholder once every loaded option is selected and there's nothing left to load", async () => {
		const screen = render(<HideSelectedOptions loadOptions={threePerPage} />);

		await openMenu(screen);

		await getMenuOption(screen, "Option 1").click();
		await getMenuOption(screen, "Option 2").click();
		await getMenuOption(screen, "Option 3").click();

		await expect.element(getMenuOption(screen, "Option 4")).toBeInTheDocument();

		await getMenuOption(screen, "Option 4").click();
		await getMenuOption(screen, "Option 5").click();
		await getMenuOption(screen, "Option 6").click();

		await expect
			.element(screen.getByText("Não há mais opções disponíveis"))
			.toBeInTheDocument();
	});
});
