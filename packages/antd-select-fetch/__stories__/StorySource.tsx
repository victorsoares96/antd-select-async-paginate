import type { ReactElement } from "react";

type StorySourceProps = {
	code: string;
};

export function StorySource({ code }: StorySourceProps): ReactElement {
	return (
		<pre
			style={{
				marginTop: 16,
				padding: 12,
				background: "#1e1e1e",
				color: "#d4d4d4",
				fontSize: 12,
				overflowX: "auto",
				borderRadius: 4,
			}}
		>
			<code>{code}</code>
		</pre>
	);
}
