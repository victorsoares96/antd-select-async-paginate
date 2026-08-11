import type { Meta, StoryObj } from "@storybook/react";
import { ResponsiveTags } from "./ResponsiveTags";

const meta: Meta<typeof ResponsiveTags> = {
	title: "react-select-async-paginate",
	component: ResponsiveTags,
};
export default meta;
type Story = StoryObj<typeof ResponsiveTags>;

export const ResponsiveTagsStory: Story = {
	name: "Responsive tags (maxTagCount)",
	render: (props) => <ResponsiveTags {...props} />,
};
