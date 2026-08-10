import type { GroupBase, OptionsOrGroups } from "./types";

export const defaultReduceOptions = <
	OptionType,
	Group extends GroupBase<OptionType>,
>(
	prevOptions: OptionsOrGroups<OptionType, Group>,
	loadedOptions: OptionsOrGroups<OptionType, Group>,
) => [...prevOptions, ...loadedOptions];
