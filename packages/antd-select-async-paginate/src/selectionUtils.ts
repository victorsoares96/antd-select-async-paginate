// Shared by mergeSelectedOnTop / showNoMoreOptionsPlaceholder (withAsyncPaginate.tsx)
// and createSelectAllOption.ts — a single place to fix grouped-options
// bail-out and selected-value lookup behavior for all three.

export function isGroupedOptions<OptionType>(
	options: ReadonlyArray<OptionType | { options: readonly OptionType[] }>,
): boolean {
	return options.some(
		(option) => option && typeof option === "object" && "options" in option,
	);
}

export function buildSelectedValuesSet<OptionType>(
	value: OptionType | readonly OptionType[] | null | undefined,
	valueFieldName: string,
): Set<unknown> {
	const selected = value == null ? [] : Array.isArray(value) ? value : [value];

	return new Set(
		selected.map(
			(option) => (option as Record<string, unknown>)[valueFieldName],
		),
	);
}

export function everyOptionSelected<OptionType>(
	options: ReadonlyArray<OptionType>,
	selectedValues: Set<unknown>,
	valueFieldName: string,
): boolean {
	if (options.length === 0) {
		return false;
	}

	return options.every((option) =>
		selectedValues.has((option as Record<string, unknown>)[valueFieldName]),
	);
}
