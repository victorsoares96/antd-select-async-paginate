import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { SelectAllOptionWithTerm } from "./SelectAllOptionWithTerm";
import rawSource from "./SelectAllOptionWithTerm.tsx?raw";

const meta: Meta<typeof SelectAllOptionWithTerm> = {
	title: "antd-select-async-paginate",
	component: SelectAllOptionWithTerm,
};
export default meta;
type Story = StoryObj<typeof SelectAllOptionWithTerm>;

export const SelectAllOptionWithTermStory: Story = {
	name: "Select all option with term",
	args: {
		closeMenuOnSelect: false,
	},
	render: (props) => (
		<>
			<SelectAllOptionWithTerm {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
