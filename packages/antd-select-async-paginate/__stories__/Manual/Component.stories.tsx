import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { Manual } from "./Manual";
import rawSource from "./Manual.tsx?raw";

const meta: Meta<typeof Manual> = {
	title: "antd-select-async-paginate",
	component: Manual,
};
export default meta;
type Story = StoryObj<typeof Manual>;

export const ManualStory: Story = {
	name: "Manual",
	render: (props) => (
		<>
			<Manual {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
