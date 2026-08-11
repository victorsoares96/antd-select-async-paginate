import type { Select as AntdSelect, GetProp } from "antd";
import {
	type GroupBase,
	highlightText,
	type UseAsyncPaginateResult,
} from "antd-select-async-paginate";
import type { ReactElement } from "react";
import { useCallback, useRef } from "react";
import type { SelectFetchProps, SelectFetchType } from "./types";
import { useSelectFetch } from "./useSelectFetch";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;
type AntdOptionRender = GetProp<typeof AntdSelect, "optionRender">;
type AntdFieldNames = GetProp<typeof AntdSelect, "fieldNames">;

let hideSelectedOptionsUniqCounter = 0;

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
			highlightSearchTerm = false,
			popupClassName,
			optionRender,
			fieldNames,
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

		// See withAsyncPaginate.tsx for why hideSelectedOptions hides via CSS
		// instead of filtering `options`: filtering breaks rc-select's
		// ability to rebuild already-selected options' full data on later
		// selections.
		const hideSelectedOptionsClassNameRef = useRef<string>(undefined);
		if (!hideSelectedOptionsClassNameRef.current) {
			hideSelectedOptionsUniqCounter += 1;
			hideSelectedOptionsClassNameRef.current = `async-paginate-hide-selected-options-${hideSelectedOptionsUniqCounter}`;
		}

		const labelFieldName =
			(fieldNames as AntdFieldNames | undefined)?.label ?? "label";

		const highlightOptions =
			highlightSearchTerm === true ? {} : highlightSearchTerm || undefined;

		const resolvedOptionRender: AntdOptionRender | undefined =
			optionRender ??
			(highlightOptions
				? (option) => {
						const label = (option.data as Record<string, unknown>)[
							labelFieldName
						];

						if (typeof label !== "string") {
							return option.label;
						}

						return highlightText(
							label,
							asyncPaginateProps.inputValue,
							highlightOptions,
						);
					}
				: undefined);

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
			<>
				{hideSelectedOptions ? (
					<style>
						{`.${hideSelectedOptionsClassNameRef.current} .ant-select-item-option-selected { display: none; }`}
					</style>
				) : null}
				<SelectComponent
					{...(restSelectProps as object)}
					popupClassName={
						hideSelectedOptions
							? [popupClassName, hideSelectedOptionsClassNameRef.current]
									.filter(Boolean)
									.join(" ")
							: popupClassName
					}
					fieldNames={fieldNames}
					optionRender={resolvedOptionRender}
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
			</>
		);
	}

	return WithSelectFetch;
}
