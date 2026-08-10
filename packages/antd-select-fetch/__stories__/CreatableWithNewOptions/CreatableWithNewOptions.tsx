import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import sleep from "sleep-promise";
import type { Get } from "../../src";
import { SelectFetch } from "../../src";
import type { StoryProps } from "../types";

type CreatableWithNewOptionsStoryProps = StoryProps & {
	get?: Get;
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

export async function get<Response>(
	_url: string,
	params: { [key: string]: unknown },
): Promise<Response> {
	await sleep(500);

	const search = typeof params?.search === "string" ? params.search : "";
	const offset = typeof params?.offset === "number" ? params.offset : 0;
	const limit = typeof params?.limit === "number" ? params.limit : 10;

	let filteredOptions: OptionType[];

	if (search.length === 0) {
		filteredOptions = options;
	} else {
		const searchLower = search.toLowerCase();
		filteredOptions = options.filter(({ label }) =>
			label.toLowerCase().includes(searchLower),
		);
	}

	const hasMore = filteredOptions.length > offset + limit;
	const slicedOptions = filteredOptions.slice(offset, offset + limit);

	return {
		options: slicedOptions,
		hasMore,
	} as Response;
}

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
// notFoundContent when the typed value matches nothing.
export function CreatableWithNewOptions(
	props: CreatableWithNewOptionsStoryProps,
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

	const getHandler = props?.get || get;

	const exactMatchExists = options.some(
		(option) => option.label.toLowerCase() === inputValue.toLowerCase(),
	);
	const showCreateAffordance = inputValue.length > 0 && !exactMatchExists;

	return (
		<div
			style={{
				maxWidth: 300,
			}}
		>
			<SelectFetch
				{...props}
				disabled={isAddingInProgress}
				url="/options/"
				queryParams={{
					limit: 10,
				}}
				value={value}
				inputValue={inputValue}
				onInputChange={setInputValue}
				menuIsOpen={menuIsOpen}
				onMenuOpen={() => setMenuIsOpen(true)}
				onMenuClose={() => setMenuIsOpen(false)}
				onChange={(nextValue) => {
					onChange(nextValue);
					setInputValue("");
				}}
				cacheUniqs={[cacheUniq]}
				get={getHandler}
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

			<p>Current value is {JSON.stringify(value)}</p>
		</div>
	);
}
