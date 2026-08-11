import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { GroupedOptions } from "./GroupedOptions";
import rawSource from "./GroupedOptions.tsx?raw";

const meta: Meta<typeof GroupedOptions> = {
	title: "antd-select-async-paginate",
	component: GroupedOptions,
};
export default meta;
type Story = StoryObj<typeof GroupedOptions>;

export const GroupedOptionsStory: Story = {
	name: "Grouped Options",
	render: (props) => (
		<>
			<GroupedOptions {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
