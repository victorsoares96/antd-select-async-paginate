import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import sleep from "sleep-promise";
import type { GroupBase, LoadOptions } from "../../src";
import {
	AsyncPaginate,
	createSelectAllOption,
	resolveSelectAllChange,
} from "../../src";

import type { StoryProps } from "../types";

type SelectAllOptionWithTermStoryProps = StoryProps & {
	loadOptions?: LoadOptions<OptionType, GroupBase<OptionType>, unknown>;
};

type OptionType = {
	value: string;
	label: string;
};

const options: OptionType[] = [];
for (let i = 0; i < 50; ++i) {
	options.push({
		value: String(i + 1),
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

// Only the `searchLabel` variant matters for this demo — it's what
// `createSelectAllOption` builds once a search term is active, distinct
// from the unfiltered "Todos" value/label so it never collides with a real
// option's value.
export const selectAllOption = createSelectAllOption({
	value: "__all__",
	label: "Todos",
	searchLabel: (search) => `Todos com o termo: "${search}"`,
});

export function SelectAllOptionWithTerm(
	props: SelectAllOptionWithTermStoryProps,
): ReactElement {
	const [value, setValue] = useState<OptionType[]>([]);

	const loadOptionsHandler = props?.loadOptions || loadOptions;

	const handleChange = useCallback(
		(nextValue: OptionType | OptionType[] | null) => {
			const nextArray = Array.isArray(nextValue)
				? nextValue
				: nextValue
					? [nextValue]
					: [];

			setValue(
				resolveSelectAllChange(
					value,
					nextArray,
					selectAllOption.isSelectAllOption,
				),
			);
		},
		[value],
	);

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
				defaultInputValue="Option 1"
				loadOptions={loadOptionsHandler}
				selectAllOption={selectAllOption}
				onChange={handleChange}
			/>

			<p>Current value is {JSON.stringify(value)}</p>
		</div>
	);
}
