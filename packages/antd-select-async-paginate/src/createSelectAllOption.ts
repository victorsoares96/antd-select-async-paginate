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

export type SelectAllOptionBuilder<Value extends string, Label> = {
	(inputValue: string): { value: SelectAllOptionValue<Value>; label: Label };
	/**
	 * Matches both the unfiltered and search-scoped select-all options this
	 * builder produces. Pass as the 3rd argument of `resolveSelectAllChange`.
	 */
	isSelectAllOption: (option: { value: unknown }) => boolean;
};

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
	const buildSelectAllOption = ((inputValue: string) => {
		if (!inputValue) {
			return { value: baseValue, label };
		}

		return {
			value: `${baseValue}:${inputValue}` as SelectAllOptionValue<Value>,
			label: searchLabel(inputValue),
		};
	}) as SelectAllOptionBuilder<Value, Label>;

	buildSelectAllOption.isSelectAllOption = (option: {
		value: unknown;
	}): boolean =>
		typeof option.value === "string" &&
		(option.value === baseValue || option.value.startsWith(`${baseValue}:`));

	return buildSelectAllOption;
}
