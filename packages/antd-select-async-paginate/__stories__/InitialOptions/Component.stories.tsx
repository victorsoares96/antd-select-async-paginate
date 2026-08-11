import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { InitialOptions } from "./InitialOptions";
import rawSource from "./InitialOptions.tsx?raw";

const meta: Meta<typeof InitialOptions> = {
	title: "antd-select-async-paginate",
	component: InitialOptions,
};
export default meta;
type Story = StoryObj<typeof InitialOptions>;

export const InitialOptionsStory: Story = {
	name: "Initial Options",
	render: (props) => (
		<>
			<InitialOptions {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
