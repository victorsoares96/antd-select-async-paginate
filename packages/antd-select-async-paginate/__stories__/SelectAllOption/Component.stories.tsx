import type { Meta, StoryObj } from "@storybook/react";
import { SelectAllOption } from "./SelectAllOption";

const meta: Meta<typeof SelectAllOption> = {
	title: "react-select-async-paginate",
	component: SelectAllOption,
};
export default meta;
type Story = StoryObj<typeof SelectAllOption>;

export const SelectAllOptionStory: Story = {
	name: "Select all option",
	render: (props) => <SelectAllOption {...props} />,
};
