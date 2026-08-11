import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { HighlightSearchTerm } from "./HighlightSearchTerm";
import rawSource from "./HighlightSearchTerm.tsx?raw";

const meta: Meta<typeof HighlightSearchTerm> = {
	title: "react-select-async-paginate",
	component: HighlightSearchTerm,
};
export default meta;
type Story = StoryObj<typeof HighlightSearchTerm>;

export const HighlightSearchTermStory: Story = {
	name: "Highlight search term",
	render: (props) => (
		<>
			<HighlightSearchTerm {...props} />
			<StorySource code={rawSource} />
		</>
	),
};

export const HighlightSearchTermCustomStyleStory: Story = {
	name: "Highlight search term (custom style)",
	args: {
		highlightSearchTerm: {
			style: { backgroundColor: "#b7eb8f", padding: "0 2px" },
		},
	},
	render: (props) => (
		<>
			<HighlightSearchTerm {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
