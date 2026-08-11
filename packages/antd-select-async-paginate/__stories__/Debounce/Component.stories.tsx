import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { Debounce } from "./Debounce";
import rawSource from "./Debounce.tsx?raw";

const meta: Meta<typeof Debounce> = {
	title: "react-select-async-paginate",
	component: Debounce,
};
export default meta;
type Story = StoryObj<typeof Debounce>;

export const DebounceStory: Story = {
	name: "Debounce",
	render: (props) => (
		<>
			<Debounce {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
