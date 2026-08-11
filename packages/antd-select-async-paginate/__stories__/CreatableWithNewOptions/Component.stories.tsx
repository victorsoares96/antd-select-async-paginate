import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { CreatableWithNewOptions } from "./CreatableWithNewOptions";
import rawSource from "./CreatableWithNewOptions.tsx?raw";

const meta: Meta<typeof CreatableWithNewOptions> = {
	title: "react-select-async-paginate",
	component: CreatableWithNewOptions,
};
export default meta;
type Story = StoryObj<typeof CreatableWithNewOptions>;

export const CreatableWithNewOptionsStory: Story = {
	name: "Creatable with New Options",
	render: (props) => (
		<>
			<CreatableWithNewOptions {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
