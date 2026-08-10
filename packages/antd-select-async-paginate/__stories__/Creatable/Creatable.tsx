import type { ReactElement } from "react";
import { useState } from "react";
import sleep from "sleep-promise";
import type { GroupBase, LoadOptions } from "../../src";
import { AsyncPaginate } from "../../src";
import type { StoryProps } from "../types";

type CreatableStoryProps = StoryProps & {
	loadOptions?: LoadOptions<OptionType, GroupBase<OptionType>, null>;
};

export type OptionType = {
	value: number | string;
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
	null
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

// antd's Select has no built-in "Creatable" mode like react-select/creatable.
// This is a demo-only DIY pattern: show a "Create ..." affordance via
// notFoundContent when the typed value matches nothing, and manually
// select+close on click.
export function Creatable(props: CreatableStoryProps): ReactElement {
	const [value, onChange] = useState<OptionType | OptionType[] | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [menuIsOpen, setMenuIsOpen] = useState(false);

	const loadOptionsHandler = props?.loadOptions || loadOptions;

	const exactMatchExists = options.some(
		(option) => option.label.toLowerCase() === inputValue.toLowerCase(),
	);
	const showCreateAffordance = inputValue.length > 0 && !exactMatchExists;

	const createOption = () => {
		onChange({ label: inputValue, value: inputValue });
		setInputValue("");
		setMenuIsOpen(false);
	};

	return (
		<div
			style={{
				maxWidth: 300,
			}}
		>
			<AsyncPaginate
				{...props}
				value={value}
				inputValue={inputValue}
				onInputChange={setInputValue}
				menuIsOpen={menuIsOpen}
				onMenuOpen={() => setMenuIsOpen(true)}
				onMenuClose={() => setMenuIsOpen(false)}
				loadOptions={loadOptionsHandler}
				onChange={(nextValue) => {
					onChange(nextValue);
					setInputValue("");
				}}
				notFoundContent={
					showCreateAffordance ? (
						<button
							type="button"
							onClick={createOption}
							style={{ cursor: "pointer" }}
						>
							Create "{inputValue}"
						</button>
					) : undefined
				}
			/>
		</div>
	);
}
