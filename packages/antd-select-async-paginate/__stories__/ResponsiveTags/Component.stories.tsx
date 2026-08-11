import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { ResponsiveTags } from "./ResponsiveTags";
import rawSource from "./ResponsiveTags.tsx?raw";

const meta: Meta<typeof ResponsiveTags> = {
	title: "antd-select-async-paginate",
	component: ResponsiveTags,
};
export default meta;
type Story = StoryObj<typeof ResponsiveTags>;

export const ResponsiveTagsStory: Story = {
	name: "Responsive tags (maxTagCount)",
	render: (props) => (
		<>
			<ResponsiveTags {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
