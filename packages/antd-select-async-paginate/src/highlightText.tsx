import type { CSSProperties, ReactNode } from "react";

export type HighlightTextOptions = {
	className?: string;
	style?: CSSProperties;
};

const defaultMarkStyle: CSSProperties = {
	padding: 0,
	backgroundColor: "#ffe58f",
};

export function highlightText(
	text: string,
	searchTerm: string,
	{ className, style }: HighlightTextOptions = {},
): ReactNode {
	if (!searchTerm) {
		return text;
	}

	const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const parts = text.split(new RegExp(`(${escaped})`, "gi"));

	if (parts.length === 1) {
		return text;
	}

	return parts.map((part, index) =>
		index % 2 === 1 ? (
			// biome-ignore lint/suspicious/noArrayIndexKey: parts never reorder
			<mark key={index} className={className} style={style ?? defaultMarkStyle}>
				{part}
			</mark>
		) : (
			part
		),
	);
}
