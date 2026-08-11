import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { CustomScrollCheck } from "./CustomScrollCheck";
import rawSource from "./CustomScrollCheck.tsx?raw";

const meta: Meta<typeof CustomScrollCheck> = {
	title: "antd-select-async-paginate",
	component: CustomScrollCheck,
};
export default meta;
type Story = StoryObj<typeof CustomScrollCheck>;

export const CustomScrollCheckStory: Story = {
	name: "Custom Scroll Check",
	render: (props) => (
		<>
			<CustomScrollCheck {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
