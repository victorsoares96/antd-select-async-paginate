import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ResponsiveTags } from "./ResponsiveTags";

describe("ResponsiveTags", () => {
	test("collapses overflowing tags into a '+N more' placeholder", async () => {
		const screen = render(<ResponsiveTags />);

		// 5 preselected options in a 300px-wide select won't all fit as
		// individual tags — antd's maxTagCount="responsive" collapses the
		// overflow into our custom maxTagPlaceholder.
		await expect.element(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
	});
});
