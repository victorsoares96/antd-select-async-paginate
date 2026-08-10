export const resolveSelectAllChange = <OptionType>(
	prevValue: readonly OptionType[],
	nextValue: readonly OptionType[],
	isSelectAllOption: (option: OptionType) => boolean,
): OptionType[] => {
	if (nextValue.length <= prevValue.length) {
		// an option was deselected (or nothing changed) — no special handling
		return [...nextValue];
	}

	// antd/rc-select appends the newly picked option at the end of the value
	// array and rebuilds every option object from its current `options` list
	// (not necessarily the same object references passed in via `value`), so
	// this can't rely on reference identity to tell which option is "new" —
	// position is the reliable signal.
	const addedOption = nextValue[nextValue.length - 1];

	if (isSelectAllOption(addedOption)) {
		// picking any select-all variant (even while a different select-all
		// variant, e.g. an unfiltered one, was already selected) replaces
		// the whole value with just that option
		return [addedOption];
	}

	if (prevValue.some(isSelectAllOption)) {
		// picking an individual option while a select-all option was active
		// drops the select-all option
		return nextValue.filter((option) => !isSelectAllOption(option));
	}

	return [...nextValue];
};
