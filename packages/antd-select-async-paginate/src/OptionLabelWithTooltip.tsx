import type { MouseEvent, ReactNode } from "react";

export type OptionLabelWithTooltipProps = {
	label: ReactNode;
	title: string | undefined;
};

function handleMouseEnter(event: MouseEvent<HTMLSpanElement>): void {
	const el = event.currentTarget;
	el.title =
		el.scrollWidth > el.clientWidth ? (el.dataset.fullLabel ?? "") : "";
}

export function OptionLabelWithTooltip({
	label,
	title,
}: OptionLabelWithTooltipProps): ReactNode {
	if (title === undefined) {
		return label;
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: onMouseEnter only measures overflow to set a native title, no interaction semantics
		<span
			style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}
			data-full-label={title}
			onMouseEnter={handleMouseEnter}
		>
			{label}
		</span>
	);
}
