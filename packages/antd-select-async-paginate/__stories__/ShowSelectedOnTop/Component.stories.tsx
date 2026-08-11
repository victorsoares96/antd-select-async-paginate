import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { ShowSelectedOnTop } from "./ShowSelectedOnTop";
import rawSource from "./ShowSelectedOnTop.tsx?raw";

const meta: Meta<typeof ShowSelectedOnTop> = {
	title: "react-select-async-paginate",
	component: ShowSelectedOnTop,
};
export default meta;
type Story = StoryObj<typeof ShowSelectedOnTop>;

export const ShowSelectedOnTopStory: Story = {
	name: "Show selected on top",
	args: {
		hideSelectedOptions: false,
	},
	render: (props) => (
		<>
			<ShowSelectedOnTop {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
