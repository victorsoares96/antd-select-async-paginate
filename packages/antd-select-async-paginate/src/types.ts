import type { SelectProps as AntdSelectProps } from "antd";
import type { ReactElement, Ref, UIEvent } from "react";

export type RequestOptionsCallerType =
	| "autoload"
	| "menu-toggle"
	| "input-change"
	| "menu-scroll";

export type GroupBase<OptionType> = {
	label?: string;
	options: readonly OptionType[];
};

export type OptionsOrGroups<
	OptionType,
	Group extends GroupBase<OptionType>,
> = ReadonlyArray<OptionType | Group>;

export type ReduceOptions<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = (
	prevOptions: OptionsOrGroups<OptionType, Group>,
	loadedOptions: OptionsOrGroups<OptionType, Group>,
	additional: Additional | undefined,
) => OptionsOrGroups<OptionType, Group>;

export type OptionsCacheItem<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	isFirstLoad: boolean;
	isLoading: boolean;
	lockedUntil: number;
	options: OptionsOrGroups<OptionType, Group>;
	hasMore: boolean;
	additional?: Additional;
};

export type OptionsCache<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	[key: string]: OptionsCacheItem<OptionType, Group, Additional>;
};

export type ShouldLoadMore = (
	scrollHeight: number,
	clientHeight: number,
	scrollTop: number,
) => boolean;

export type Response<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	options: OptionsOrGroups<OptionType, Group>;
	hasMore?: boolean;
	additional?: Additional;
};

export type LoadOptions<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = (
	inputValue: string,
	options: OptionsOrGroups<OptionType, Group>,
	additional?: Additional,
) =>
	| Response<OptionType, Group, Additional>
	| Promise<Response<OptionType, Group, Additional>>;

export type FilterOption<OptionType> =
	| ((inputValue: string, option: OptionType | undefined) => boolean)
	| false;

export type UseAsyncPaginateBaseResult<
	OptionType,
	Group extends GroupBase<OptionType>,
> = {
	handlePopupScroll: (event: UIEvent<HTMLDivElement>) => void;
	shouldLoadMore: ShouldLoadMore;
	isLoading: boolean;
	isFirstLoad: boolean;
	options: OptionsOrGroups<OptionType, Group>;
	filterOption: FilterOption<OptionType>;
};

export type UseAsyncPaginateResult<
	OptionType,
	Group extends GroupBase<OptionType>,
> = UseAsyncPaginateBaseResult<OptionType, Group> & {
	inputValue: string;
	menuIsOpen: boolean;
	onInputChange: (newValue: string) => void;
	onMenuClose: () => void;
	onMenuOpen: () => void;
};

export type UseAsyncPaginateParams<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = {
	/**
	 * Clear all cached options on search change
	 */
	clearCacheOnSearchChange?: boolean;
	/**
	 * Clear all cached options on menu close
	 */
	clearCacheOnMenuClose?: boolean;
	loadOptions: LoadOptions<OptionType, Group, Additional>;
	options?: OptionsOrGroups<OptionType, Group>;
	defaultOptions?: boolean | OptionsOrGroups<OptionType, Group>;
	additional?: Additional;
	defaultAdditional?: Additional;
	loadOptionsOnMenuOpen?: boolean;
	debounceTimeout?: number;
	reduceOptions?: ReduceOptions<OptionType, Group, Additional>;
	shouldLoadMore?: ShouldLoadMore;
	filterOption?: FilterOption<OptionType>;
	inputValue?: string;
	menuIsOpen?: boolean;
	defaultInputValue?: string;
	defaultMenuIsOpen?: boolean;
	/**
	 * Post-mapping of loaded options to display them in the menu
	 * @param options loaded options
	 * @returns options to display in the menu
	 */
	mapOptionsForMenu?: (
		options: OptionsOrGroups<OptionType, Group>,
	) => OptionsOrGroups<OptionType, Group>;
	/**
	 * Builds a synthetic "select all" option prepended to the menu (after
	 * `mapOptionsForMenu`). Called with the current search value on every
	 * render, so the option can encode the active search term (e.g. an
	 * "All matching…" option) or be hidden entirely by returning `null`.
	 * Pair with `resolveSelectAllChange` in `onChange` to make selecting it
	 * mutually exclusive with individual options.
	 * @param inputValue current search value
	 * @returns the option to prepend, or `null` to show nothing
	 */
	selectAllOption?: (inputValue: string) => OptionType | null;
	onInputChange?: (newValue: string) => void;
	onMenuClose?: () => void;
	onMenuOpen?: () => void;
	reloadOnErrorTimeout?: number;
};

export type UseAsyncPaginateBaseParams<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
> = UseAsyncPaginateParams<OptionType, Group, Additional> & {
	inputValue: string;
	menuIsOpen: boolean;
};

export type ComponentProps<_OptionType> = {
	selectRef?: Ref<HTMLElement>;
	cacheUniqs?: ReadonlyArray<unknown>;
	/**
	 * Convenience for antd's `mode="multiple"` — matches react-select's
	 * `isMulti` convention. Ignored if `mode` is passed explicitly.
	 */
	isMulti?: boolean;
};

export type AsyncPaginateProps<
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
	_IsMulti extends boolean,
> = Omit<
	AntdSelectProps<OptionType>,
	"options" | "onChange" | "filterOption" | "value"
> &
	UseAsyncPaginateParams<OptionType, Group, Additional> &
	ComponentProps<OptionType> & {
		mode?: "multiple" | "tags";
		value?: OptionType | readonly OptionType[] | null;
		onChange?: (value: OptionType | OptionType[] | null) => void;
	};

export type WithAsyncPaginateType = <
	OptionType,
	Group extends GroupBase<OptionType>,
	Additional,
	IsMulti extends boolean = false,
>(
	props: AsyncPaginateProps<OptionType, Group, Additional, IsMulti>,
) => ReactElement;
