import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { Autoload } from "./Autoload";
import rawSource from "./Autoload.tsx?raw";

const meta: Meta<typeof Autoload> = {
	title: "antd-select-async-paginate",
	component: Autoload,
};
export default meta;
type Story = StoryObj<typeof Autoload>;

export const AutoloadStory: Story = {
	name: "Autoload",
	render: (props) => (
		<>
			<Autoload {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
