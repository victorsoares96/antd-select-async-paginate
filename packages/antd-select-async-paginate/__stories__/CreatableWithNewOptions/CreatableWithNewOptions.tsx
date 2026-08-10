import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import sleep from "sleep-promise";
import type { GroupBase, LoadOptions } from "../../src";
import { AsyncPaginate } from "../../src";
import type { StoryProps } from "../types";

type CreatableWithNewOptionsProps = StoryProps & {
	loadOptions?: LoadOptions<OptionType, GroupBase<OptionType>, null>;
};

type OptionType = {
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

const addNewOption = async (inputValue: string): Promise<OptionType> => {
	await sleep(500);

	const newOption = {
		label: inputValue,
		value: inputValue,
	};

	options.push(newOption);

	return newOption;
};

const increaseUniq = (uniq: number): number => uniq + 1;

// antd's Select has no built-in "Creatable" mode like react-select/creatable.
// This is a demo-only DIY pattern: show a "Create ..." affordance via
// notFoundContent when the typed value matches nothing, calling the same
// onCreateOption-style flow (async add + cache-busting) the old story used.
export function CreatableWithNewOptions(
	props: CreatableWithNewOptionsProps,
): ReactElement {
	const [cacheUniq, setCacheUniq] = useState(0);
	const [isAddingInProgress, setIsAddingInProgress] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [menuIsOpen, setMenuIsOpen] = useState(false);
	const [value, onChange] = useState<OptionType | OptionType[] | null>(null);

	const onCreateOption = useCallback(async () => {
		setIsAddingInProgress(true);

		const newOption = await addNewOption(inputValue);

		setIsAddingInProgress(false);
		setCacheUniq(increaseUniq);
		setInputValue("");
		setMenuIsOpen(false);
		onChange(newOption);
	}, [inputValue]);

	const loadOptionsHandler = props?.loadOptions || loadOptions;

	const exactMatchExists = options.some(
		(option) => option.label.toLowerCase() === inputValue.toLowerCase(),
	);
	const showCreateAffordance = inputValue.length > 0 && !exactMatchExists;

	return (
		<>
			<div
				style={{
					maxWidth: 300,
				}}
			>
				<AsyncPaginate
					{...props}
					disabled={isAddingInProgress}
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
					cacheUniqs={[cacheUniq]}
					notFoundContent={
						showCreateAffordance ? (
							<button
								type="button"
								onClick={onCreateOption}
								style={{ cursor: "pointer" }}
							>
								Create "{inputValue}"
							</button>
						) : undefined
					}
				/>
			</div>

			<p>Current value is {JSON.stringify(value)}</p>
		</>
	);
}
