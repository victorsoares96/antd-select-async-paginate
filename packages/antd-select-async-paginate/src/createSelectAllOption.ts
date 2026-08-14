export type SelectAllOptionValue<Value extends string> =
	| Value
	| `${Value}:${string}`;

export type CreateSelectAllOptionParams<Value extends string, Label> = {
	/** Base value used when there's no active search */
	value: Value;
	/** Label used when there's no active search */
	label: Label;
	/** Label used while a search is active, receives the current search value */
	searchLabel: (inputValue: string) => Label;
};

export type SelectAllOptionContext<OptionType extends { value: unknown }> = {
	/** Currently selected value(s), as controlled by the consumer */
	value: OptionType | readonly OptionType[] | null | undefined;
	/** Currently loaded options (post `mapOptionsForMenu`) — flat or grouped */
	options: ReadonlyArray<OptionType | { options: readonly OptionType[] }>;
	/** Whether more pages are still available to load */
	hasMore: boolean;
};

export type SelectAllOptionBuilder<Value extends string, Label> = {
	<OptionType extends { value: unknown }>(
		inputValue: string,
		context?: SelectAllOptionContext<OptionType>,
	): { value: SelectAllOptionValue<Value>; label: Label } | null;
	/**
	 * Matches both the unfiltered and search-scoped select-all options this
	 * builder produces. Pass as the 3rd argument of `resolveSelectAllChange`.
	 */
	isSelectAllOption: (option: { value: unknown }) => boolean;
};

// Grouped options (`GroupBase[]`) have no flat item list to compare
// against — bail out the same way `mergeSelectedOnTop` does for
// `showSelectedOnTop`.
function isGrouped<OptionType extends { value: unknown }>(
	context: SelectAllOptionContext<OptionType>,
): boolean {
	return context.options.some((option) => "options" in option);
}

function isEverySelected<OptionType extends { value: unknown }>(
	context: SelectAllOptionContext<OptionType> | undefined,
): boolean {
	if (
		!context ||
		context.hasMore ||
		context.options.length === 0 ||
		isGrouped(context)
	) {
		return false;
	}

	const { value } = context;
	const options = context.options as readonly OptionType[];

	const selected = value == null ? [] : Array.isArray(value) ? value : [value];
	const selectedValues = new Set(selected.map((option) => option.value));

	return options.every((option) => selectedValues.has(option.value));
}

// Selecting "all" only means something with 2+ items on offer — with 0 or 1
// loaded, hide the option regardless of hasMore/selection state.
function hasFewerThanTwoOptions<OptionType extends { value: unknown }>(
	context: SelectAllOptionContext<OptionType> | undefined,
): boolean {
	if (!context || isGrouped(context)) {
		return false;
	}

	return context.options.length < 2;
}

/**
 * Convenience over the `selectAllOption` prop for the common
 * `{ value, label }` option shape: builds the value/label pair for both the
 * unfiltered ("Todos") and search-scoped ("Todos com o termo: X") variants,
 * keeping their values distinct (`<value>` vs `<value>:<search>`) so they
 * never collide with real option values.
 *
 * For any other `OptionType` shape, write `selectAllOption` by hand instead.
 */
export function createSelectAllOption<Value extends string, Label>({
	value: baseValue,
	label,
	searchLabel,
}: CreateSelectAllOptionParams<Value, Label>): SelectAllOptionBuilder<
	Value,
	Label
> {
	const baseValueString = String(baseValue);

	const buildSelectAllOption = ((
		inputValue: string,
		context?: SelectAllOptionContext<{ value: unknown }>,
	) => {
		if (isEverySelected(context) || hasFewerThanTwoOptions(context)) {
			return null;
		}

		if (!inputValue) {
			return { value: baseValue, label };
		}

		return {
			value: `${baseValue}:${inputValue}` as SelectAllOptionValue<Value>,
			label: searchLabel(inputValue),
		};
	}) as SelectAllOptionBuilder<Value, Label>;

	// Compares by string content rather than gating on `typeof option.value
	// === "string"`: the `Value extends string` constraint is compile-time
	// only, so a caller bypassing it with a cast (or plain JS, no type-check
	// at all) can hand a non-string `value` in here — matching by
	// stringified content still recognizes it as the select-all option.
	buildSelectAllOption.isSelectAllOption = (option: {
		value: unknown;
	}): boolean => {
		if (typeof option.value !== "string" && typeof option.value !== "number") {
			return false;
		}

		const optionValueString = String(option.value);

		return (
			optionValueString === baseValueString ||
			optionValueString.startsWith(`${baseValueString}:`)
		);
	};

	return buildSelectAllOption;
}
