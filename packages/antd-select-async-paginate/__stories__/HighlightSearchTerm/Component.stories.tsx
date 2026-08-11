import type { Meta, StoryObj } from "@storybook/react";
import { HighlightSearchTerm } from "./HighlightSearchTerm";

const meta: Meta<typeof HighlightSearchTerm> = {
	title: "react-select-async-paginate",
	component: HighlightSearchTerm,
};
export default meta;
type Story = StoryObj<typeof HighlightSearchTerm>;

export const HighlightSearchTermStory: Story = {
	name: "Highlight search term",
	render: (props) => <HighlightSearchTerm {...props} />,
};

export const HighlightSearchTermCustomStyleStory: Story = {
	name: "Highlight search term (custom style)",
	args: {
		highlightSearchTerm: {
			style: { backgroundColor: "#b7eb8f", padding: "0 2px" },
		},
	},
	render: (props) => <HighlightSearchTerm {...props} />,
};
