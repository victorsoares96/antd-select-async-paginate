import type { Select as AntdSelect, GetProp } from "antd";
import type {
	GroupBase,
	UseAsyncPaginateResult,
} from "antd-select-async-paginate";
import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";
import type { SelectFetchProps, SelectFetchType } from "./types";
import { useSelectFetch } from "./useSelectFetch";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;
type AntdFieldNames = GetProp<typeof AntdSelect, "fieldNames">;

const getOptionValue = (option: unknown, valueFieldName: string): unknown => {
	if (typeof option !== "object" || option === null) {
		return undefined;
	}

	return (option as Record<string, unknown>)[valueFieldName];
};

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
			loading: loadingProp,
			isLoading: isLoadingLegacyProp,
			virtual = false,
			showSearch = true,
			style,
			mode,
			isMulti,
			closeMenuOnSelect = false,
			hideSelectedOptions = false,
			fieldNames,
			value,
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
			typeof loadingProp === "boolean"
				? loadingProp
				: typeof isLoadingLegacyProp === "boolean"
					? isLoadingLegacyProp
					: asyncPaginateProps.isLoading;

		const valueFieldName =
			(fieldNames as AntdFieldNames | undefined)?.value ?? "value";

		const displayedOptions = useMemo(() => {
			if (!hideSelectedOptions) {
				return asyncPaginateProps.options;
			}

			const valueArray = Array.isArray(value) ? value : value ? [value] : [];
			const selectedValues = new Set(
				valueArray.map((option) => getOptionValue(option, valueFieldName)),
			);

			return asyncPaginateProps.options.filter((option) => {
				if (
					typeof option !== "object" ||
					option === null ||
					"options" in option
				) {
					return true;
				}

				return !selectedValues.has(getOptionValue(option, valueFieldName));
			});
		}, [
			asyncPaginateProps.options,
			hideSelectedOptions,
			value,
			valueFieldName,
		]);

		const handleChange = useCallback<AntdOnChange>(
			(_value, option) => {
				onChange?.(option as never);

				if (closeMenuOnSelect) {
					asyncPaginateProps.onMenuClose();
				}
			},
			[onChange, closeMenuOnSelect, asyncPaginateProps.onMenuClose],
		);

		return (
			<SelectComponent
				{...(restSelectProps as object)}
				fieldNames={fieldNames}
				value={value as never}
				options={displayedOptions as never}
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
