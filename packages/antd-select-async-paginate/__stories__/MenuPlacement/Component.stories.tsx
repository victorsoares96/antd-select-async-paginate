import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { MenuPlacement } from "./MenuPlacement";
import rawSource from "./MenuPlacement.tsx?raw";

const meta: Meta<typeof MenuPlacement> = {
	title: "react-select-async-paginate",
	component: MenuPlacement,
};
export default meta;
type Story = StoryObj<typeof MenuPlacement>;

export const MenuPlacementStory: Story = {
	name: "Menu placement",
	render: (props) => (
		<>
			<MenuPlacement {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
