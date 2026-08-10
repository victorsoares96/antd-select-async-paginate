import type { Select as AntdSelect, GetProp } from "antd";
import type {
	GroupBase,
	UseAsyncPaginateResult,
} from "antd-select-async-paginate";
import type { ReactElement } from "react";
import { useCallback } from "react";
import type { SelectFetchProps, SelectFetchType } from "./types";
import { useSelectFetch } from "./useSelectFetch";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;

export function withSelectFetch(
	SelectComponent: typeof AntdSelect,
): SelectFetchType {
	function WithSelectFetch<
		OptionType,
		Group extends GroupBase<OptionType>,
		IsMulti extends boolean = false,
	>(props: SelectFetchProps<OptionType, Group, IsMulti>): ReactElement {
		const {
			selectRef = undefined,
			cacheUniqs = defaultCacheUniqs,
			loading: isLoadingProp,
			virtual = false,
			showSearch = true,
			style,
			mode,
			isMulti,
			onChange,

			// UseSelectFetchParams fields (url-fetching config + the
			// UseAsyncPaginateParams fields it wraps) consumed by
			// useSelectFetch below — stripped out here so they never leak
			// into `restSelectProps` and get spread onto antd's Select
			// (which forwards unknown props to the underlying DOM node).
			url,
			queryParams,
			searchParamName,
			pageParamName,
			offsetParamName,
			mapResponse,
			get,
			initialPage,
			defaultInitialPage,
			clearCacheOnSearchChange,
			clearCacheOnMenuClose,
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
			selectAllOption,
			onInputChange,
			onMenuClose,
			onMenuOpen,
			reloadOnErrorTimeout,

			...restSelectProps
		} = props;

		const asyncPaginateProps: UseAsyncPaginateResult<OptionType, Group> =
			useSelectFetch(
				{
					url,
					queryParams,
					searchParamName,
					pageParamName,
					offsetParamName,
					mapResponse,
					get,
					initialPage,
					defaultInitialPage,
					clearCacheOnSearchChange,
					clearCacheOnMenuClose,
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
					selectAllOption,
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
				mode={mode ?? (isMulti ? "multiple" : undefined)}
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
				ref={selectRef as never}
			/>
		);
	}

	return WithSelectFetch;
}
