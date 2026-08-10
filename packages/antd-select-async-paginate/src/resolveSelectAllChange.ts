export const resolveSelectAllChange = <OptionType>(
	prevValue: readonly OptionType[],
	nextValue: readonly OptionType[],
	isSelectAllOption: (option: OptionType) => boolean,
): OptionType[] => {
	const nextHasSelectAll = nextValue.some(isSelectAllOption);
	const prevHasSelectAll = prevValue.some(isSelectAllOption);

	if (nextHasSelectAll && !prevHasSelectAll) {
		return nextValue.filter(isSelectAllOption).slice(-1);
	}

	if (prevHasSelectAll && nextValue.length > prevValue.length) {
		return nextValue.filter((option) => !isSelectAllOption(option));
	}

	return [...nextValue];
};
