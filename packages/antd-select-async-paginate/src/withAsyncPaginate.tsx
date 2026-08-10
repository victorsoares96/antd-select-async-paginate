import type { Select as AntdSelect, GetProp } from "antd";
import type { ReactElement, Ref } from "react";
import { useCallback } from "react";
import type {
	AsyncPaginateProps,
	GroupBase,
	UseAsyncPaginateResult,
	WithAsyncPaginateType,
} from "./types";
import { useAsyncPaginate } from "./useAsyncPaginate";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;

export function withAsyncPaginate(
	SelectComponent: typeof AntdSelect,
): WithAsyncPaginateType {
	function WithAsyncPaginate<
		OptionType,
		Group extends GroupBase<OptionType>,
		Additional,
		IsMulti extends boolean = false,
	>(
		props: AsyncPaginateProps<OptionType, Group, Additional, IsMulti>,
	): ReactElement {
		const {
			selectRef = undefined,
			loading: isLoadingProp,
			cacheUniqs = defaultCacheUniqs,
			virtual = false,
			showSearch = true,
			style,
			onChange,

			// UseAsyncPaginateParams fields consumed by useAsyncPaginate below —
			// stripped out here so they never leak into `restSelectProps` and
			// get spread onto antd's Select (which forwards unknown props to
			// the underlying DOM node).
			clearCacheOnSearchChange,
			clearCacheOnMenuClose,
			loadOptions,
			options,
			defaultOptions,
			additional,
			defaultAdditional,
			loadOptionsOnMenuOpen,
			debounceTimeout,
			reduceOptions,
			shouldLoadMore,
			filterOption,
			inputValue,
			menuIsOpen,
			defaultInputValue,
			defaultMenuIsOpen,
			mapOptionsForMenu,
			onInputChange,
			onMenuClose,
			onMenuOpen,
			reloadOnErrorTimeout,

			...restSelectProps
		} = props;

		const asyncPaginateProps: UseAsyncPaginateResult<OptionType, Group> =
			useAsyncPaginate(
				{
					clearCacheOnSearchChange,
					clearCacheOnMenuClose,
					loadOptions,
					options,
					defaultOptions,
					additional,
					defaultAdditional,
					loadOptionsOnMenuOpen,
					debounceTimeout,
					reduceOptions,
					shouldLoadMore,
					filterOption,
					inputValue,
					menuIsOpen,
					defaultInputValue,
					defaultMenuIsOpen,
					mapOptionsForMenu,
					onInputChange,
					onMenuClose,
					onMenuOpen,
					reloadOnErrorTimeout,
				},
				cacheUniqs,
			);

		const isLoading =
			typeof isLoadingProp === "boolean"
				? isLoadingProp
				: asyncPaginateProps.isLoading;

		// antd's onChange(value, option) always gives the full option object(s)
		// as the 2nd argument — that's what this library's value/onChange
		// contract has always exposed, so ignore the primitive 1st argument.
		const handleChange = useCallback<AntdOnChange>(
			(_value, option) => {
				onChange?.(option as never);
			},
			[onChange],
		);

		return (
			<SelectComponent
				{...(restSelectProps as object)}
				options={asyncPaginateProps.options as never}
				searchValue={asyncPaginateProps.inputValue}
				onSearch={asyncPaginateProps.onInputChange}
				showSearch={showSearch}
				style={{ width: "100%", ...style }}
				open={asyncPaginateProps.menuIsOpen}
				onOpenChange={(open) => {
					if (open) {
						asyncPaginateProps.onMenuOpen();
					} else {
						asyncPaginateProps.onMenuClose();
					}
				}}
				onPopupScroll={asyncPaginateProps.handlePopupScroll}
				filterOption={asyncPaginateProps.filterOption as never}
				loading={isLoading}
				virtual={virtual}
				onChange={handleChange}
				ref={selectRef as Ref<never>}
			/>
		);
	}

	return WithAsyncPaginate;
}
