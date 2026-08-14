import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { HideSelectedOptions } from "./HideSelectedOptions";
import rawSource from "./HideSelectedOptions.tsx?raw";

const meta: Meta<typeof HideSelectedOptions> = {
	title: "antd-select-async-paginate",
	component: HideSelectedOptions,
};
export default meta;
type Story = StoryObj<typeof HideSelectedOptions>;

export const HideSelectedOptionsStory: Story = {
	name: "Hide selected options",
	render: (props) => (
		<>
			<HideSelectedOptions {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
