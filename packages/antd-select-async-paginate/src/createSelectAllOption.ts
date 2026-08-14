import { buildSelectedValuesSet, isGroupedOptions } from "./selectionUtils";
import type { GroupBase, SelectAllOptionContext } from "./types";

export type SelectAllOptionValue<Value extends string> =
	| Value
	| `${Value}:${string}`;

/**
 * Extra props merged into the built option. `value`/`label` are off limits —
 * they're owned by `value`/`searchValue` and `label`/`searchLabel`, and the
 * built-in `isSelectAllOption` matching relies on the values this builder
 * actually emits.
 */
export type SelectAllOptionExtra = Record<string, unknown> & {
	value?: never;
	label?: never;
};

export type CreateSelectAllOptionParams<
	Value extends string,
	Label,
	Extra extends SelectAllOptionExtra,
	SearchExtra extends SelectAllOptionExtra,
> = {
	/** Base value used when there's no active search */
	value: Value;
	/** Label used when there's no active search */
	label: Label;
	/** Extra props merged into the option when there's no active search */
	extra?: Extra;
	/**
	 * Builds the value used while a search is active, receives the current
	 * search value. Defaults to `` `${value}:${inputValue}` ``.
	 */
	searchValue?: (inputValue: string) => string;
	/** Label used while a search is active, receives the current search value */
	searchLabel: (inputValue: string) => Label;
	/**
	 * Extra props merged into the option while a search is active, receives
	 * the current search value
	 */
	searchExtra?: (inputValue: string) => SearchExtra;
	/**
	 * Replaces the built-in matching entirely. Only needed to recognize a
	 * select-all value this builder never produced itself — a value restored
	 * from the server after a reload, say.
	 */
	isSelectAllOption?: (option: { value: unknown }) => boolean;
};

export type SelectAllOptionBuilder<
	Value extends string,
	Label,
	Extra extends SelectAllOptionExtra,
	SearchExtra extends SelectAllOptionExtra,
> = {
	<OptionType extends { value: unknown }>(
		inputValue: string,
		context?: SelectAllOptionContext<OptionType, GroupBase<OptionType>>,
	):
		| ({ value: SelectAllOptionValue<Value>; label: Label } & Extra)
		| ({ value: string; label: Label } & SearchExtra)
		| null;
	/**
	 * Matches both the unfiltered and search-scoped select-all options this
	 * builder produces. Pass as the 3rd argument of `resolveSelectAllChange`.
	 */
	isSelectAllOption: (option: { value: unknown }) => boolean;
};

// Selecting "all" only means something with 2+ unselected items on offer.
// Waits for hasMore=false before hiding: while more pages could still load,
// today's small remaining count might grow once they arrive.
function hasFewerThanTwoUnselectedOptions<
	OptionType extends { value: unknown },
>(
	context:
		| SelectAllOptionContext<OptionType, GroupBase<OptionType>>
		| undefined,
): boolean {
	if (!context || context.hasMore || isGroupedOptions(context.options)) {
		return false;
	}

	const options = context.options as readonly OptionType[];
	const selectedValues = buildSelectedValuesSet(context.value, "value");

	const unselectedCount = options.filter(
		(option) => !selectedValues.has(option.value),
	).length;

	return unselectedCount < 2;
}

/**
 * Convenience over the `selectAllOption` prop for the common
 * `{ value, label }` option shape: builds the value/label pair for both the
 * unfiltered ("Todos") and search-scoped ("Todos com o termo: X") variants,
 * keeping their values distinct (`<value>` vs `<value>:<search>`) so they
 * never collide with real option values.
 *
 * Both variants accept extra props (`extra`/`searchExtra`), and the
 * search-scoped value can be built however you like via `searchValue`.
 *
 * For any other `OptionType` shape, write `selectAllOption` by hand instead.
 */
export function createSelectAllOption<
	Value extends string,
	Label,
	Extra extends SelectAllOptionExtra = Record<string, never>,
	SearchExtra extends SelectAllOptionExtra = Record<string, never>,
>({
	value: baseValue,
	label,
	extra,
	searchValue,
	searchLabel,
	searchExtra,
	isSelectAllOption: isSelectAllOptionParam,
}: CreateSelectAllOptionParams<Value, Label, Extra, SearchExtra>) {
	const baseValueString = String(baseValue);

	// A custom `searchValue` can produce anything, so string-shape matching
	// alone can't recognize it — remember every value actually handed out.
	const emittedValues = new Set<string>([baseValueString]);

	const buildSelectAllOption = ((
		inputValue: string,
		context?: SelectAllOptionContext<
			{ value: unknown },
			GroupBase<{ value: unknown }>
		>,
	) => {
		if (hasFewerThanTwoUnselectedOptions(context)) {
			return null;
		}

		if (!inputValue) {
			return { ...extra, value: baseValue, label };
		}

		const value = searchValue
			? searchValue(inputValue)
			: `${baseValue}:${inputValue}`;

		emittedValues.add(String(value));

		return {
			...searchExtra?.(inputValue),
			value,
			label: searchLabel(inputValue),
		};
	}) as SelectAllOptionBuilder<Value, Label, Extra, SearchExtra>;

	buildSelectAllOption.isSelectAllOption =
		isSelectAllOptionParam ??
		((option: { value: unknown }): boolean => {
			// Compares by string content rather than gating on `typeof
			// option.value === "string"`: the `Value extends string` constraint
			// is compile-time only, so a caller bypassing it with a cast (or
			// plain JS, no type-check at all) can hand a non-string `value` in
			// here — matching by stringified content still recognizes it as the
			// select-all option.
			if (
				typeof option.value !== "string" &&
				typeof option.value !== "number"
			) {
				return false;
			}

			const optionValueString = String(option.value);

			if (emittedValues.has(optionValueString)) {
				return true;
			}

			// Only the default `<value>:<search>` format is safe to recognize
			// sight unseen; a custom `searchValue` owns its own shape, and
			// guessing at it would match real options by accident.
			return (
				!searchValue && optionValueString.startsWith(`${baseValueString}:`)
			);
		});

	return buildSelectAllOption;
}
