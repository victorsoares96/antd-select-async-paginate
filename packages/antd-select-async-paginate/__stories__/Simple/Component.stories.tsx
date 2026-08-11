import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { Simple } from "./Simple";
import rawSource from "./Simple.tsx?raw";

const meta: Meta<typeof Simple> = {
	title: "antd-select-async-paginate",
	component: Simple,
};
export default meta;
type Story = StoryObj<typeof Simple>;

export const SimpleStory: Story = {
	name: "Simple",
	render: (props) => (
		<>
			<Simple {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
