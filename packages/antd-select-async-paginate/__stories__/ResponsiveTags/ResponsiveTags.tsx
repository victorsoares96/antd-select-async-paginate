import { Tooltip } from "antd";
import type { ReactElement } from "react";
import { useState } from "react";

import sleep from "sleep-promise";
import type { GroupBase, LoadOptions } from "../../src";
import { AsyncPaginate } from "../../src";

import type { StoryProps } from "../types";

type ResponsiveTagsStoryProps = StoryProps & {
	loadOptions?: LoadOptions<OptionType, GroupBase<OptionType>, unknown>;
};

type OptionType = {
	value: number;
	label: string;
};

const options: OptionType[] = [];
for (let i = 0; i < 50; ++i) {
	options.push({
		value: i + 1,
		label: `Option ${i + 1}`,
	});
}

export const loadOptions: LoadOptions<
	OptionType,
	GroupBase<OptionType>,
	unknown
> = async (search, prevOptions) => {
	await sleep(500);

	let filteredOptions: OptionType[];
	if (!search) {
		filteredOptions = options;
	} else {
		const searchLower = search.toLowerCase();

		filteredOptions = options.filter(({ label }) =>
			label.toLowerCase().includes(searchLower),
		);
	}

	const hasMore = filteredOptions.length > prevOptions.length + 10;
	const slicedOptions = filteredOptions.slice(
		prevOptions.length,
		prevOptions.length + 10,
	);

	return {
		options: slicedOptions,
		hasMore,
	};
};

const defaultValue: OptionType[] = [1, 3, 5, 7, 9].map((value) => ({
	value,
	label: `Option ${value}`,
}));

export function ResponsiveTags(props: ResponsiveTagsStoryProps): ReactElement {
	const [value, onChange] = useState<OptionType | OptionType[] | null>(
		defaultValue,
	);

	const loadOptionsHandler = props?.loadOptions || loadOptions;

	return (
		<div
			style={{
				maxWidth: 300,
			}}
		>
			<AsyncPaginate
				{...props}
				mode="multiple"
				value={value}
				loadOptions={loadOptionsHandler}
				onChange={onChange}
				maxTagCount="responsive"
				maxTagPlaceholder={(omittedValues) => (
					<Tooltip
						styles={{ root: { pointerEvents: "none" } }}
						title={omittedValues.map(({ label }) => label).join(", ")}
					>
						<span>+{omittedValues.length} more</span>
					</Tooltip>
				)}
			/>
		</div>
	);
}
