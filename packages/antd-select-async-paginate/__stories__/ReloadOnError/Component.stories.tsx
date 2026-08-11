import type { Meta, StoryObj } from "@storybook/react";
import { StorySource } from "../StorySource";
import { ReloadOnError } from "./ReloadOnError";
import rawSource from "./ReloadOnError.tsx?raw";

const meta: Meta<typeof ReloadOnError> = {
	title: "react-select-async-paginate",
	component: ReloadOnError,
};
export default meta;
type Story = StoryObj<typeof ReloadOnError>;

export const ReloadOnErrorStory: Story = {
	name: "Reload on Error",
	render: (props) => (
		<>
			<ReloadOnError {...props} />
			<StorySource code={rawSource} />
		</>
	),
};
