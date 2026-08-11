import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { PreventLoadOnMenuOpen } from "./PreventLoadOnMenuOpen";
import rawSource from "./PreventLoadOnMenuOpen.tsx?raw";

const meta: Meta<typeof PreventLoadOnMenuOpen> = {
	title: "react-select-async-paginate",
	component: PreventLoadOnMenuOpen,
};
export default meta;
type Story = StoryObj<typeof PreventLoadOnMenuOpen>;

export const PreventLoadOnMenuOpenStory: Story = {
	name: "Prevent load on menu open",
	args: {
		loadOptionsOnMenuOpen: false,
	},
	render: (props) => (
		<>
			<PreventLoadOnMenuOpen {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
