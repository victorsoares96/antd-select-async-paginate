import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import sleep from "sleep-promise";
import type { GroupBase, LoadOptions } from "../../src";
import { AsyncPaginate, resolveSelectAllChange } from "../../src";

import type { StoryProps } from "../types";

type SelectAllOptionStoryProps = StoryProps & {
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

// "__all__" (no search) or "__all__:<search>" (search active) — both are
// select-all sentinels, the suffix is only there for the app to know which
// filter was active when the user picked it.
export const isSelectAllOption = (option: OptionType): boolean =>
	option.value.startsWith("__all__");

export function buildSelectAllOption(inputValue: string): OptionType {
	if (!inputValue) {
		return { value: "__all__", label: "Todos" };
	}

	return {
		value: `__all__:${inputValue}`,
		label: `Todos com o termo: "${inputValue}"`,
	};
}

export function SelectAllOption(
	props: SelectAllOptionStoryProps,
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

			setValue(resolveSelectAllChange(value, nextArray, isSelectAllOption));
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
				loadOptions={loadOptionsHandler}
				selectAllOption={buildSelectAllOption}
				onChange={handleChange}
			/>

			<p>Current value is {JSON.stringify(value)}</p>
		</div>
	);
}
