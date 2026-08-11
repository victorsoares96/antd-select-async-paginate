import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { ClearCacheOnMenuClose } from "./ClearCacheOnMenuClose";
import rawSource from "./ClearCacheOnMenuClose.tsx?raw";

const meta: Meta<typeof ClearCacheOnMenuClose> = {
	title: "antd-select-async-paginate",
	component: ClearCacheOnMenuClose,
};
export default meta;
type Story = StoryObj<typeof ClearCacheOnMenuClose>;

export const ClearCacheOnMenuCloseStory: Story = {
	name: "Clear cache on menu close",
	render: (props) => (
		<>
			<ClearCacheOnMenuClose {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
