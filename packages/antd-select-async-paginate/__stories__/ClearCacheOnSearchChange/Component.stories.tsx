import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { ClearCacheOnSearchChange } from "./ClearCacheOnSearchChange";
import rawSource from "./ClearCacheOnSearchChange.tsx?raw";

const meta: Meta<typeof ClearCacheOnSearchChange> = {
	title: "antd-select-async-paginate",
	component: ClearCacheOnSearchChange,
};
export default meta;
type Story = StoryObj<typeof ClearCacheOnSearchChange>;

export const ClearCacheOnSearchChangeStory: Story = {
	name: "Clear cache on search change",
	render: (props) => (
		<>
			<ClearCacheOnSearchChange {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
