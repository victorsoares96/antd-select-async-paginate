import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { SelectAllOption } from "./SelectAllOption";
import rawSource from "./SelectAllOption.tsx?raw";

const meta: Meta<typeof SelectAllOption> = {
	title: "antd-select-async-paginate",
	component: SelectAllOption,
};
export default meta;
type Story = StoryObj<typeof SelectAllOption>;

export const SelectAllOptionStory: Story = {
	args: {
		closeMenuOnSelect: false,
		hideSelectedOptions: true,
	},

	name: "Select all option",
	render: (props) => (
		<>
			<SelectAllOption {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
