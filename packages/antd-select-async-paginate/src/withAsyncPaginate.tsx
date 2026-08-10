import type { Select as AntdSelect, GetProp } from "antd";
import type { ReactElement, Ref } from "react";
import { useCallback, useMemo } from "react";
import type {
	AsyncPaginateProps,
	GroupBase,
	UseAsyncPaginateResult,
	WithAsyncPaginateType,
} from "./types";
import { useAsyncPaginate } from "./useAsyncPaginate";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;
type AntdFieldNames = GetProp<typeof AntdSelect, "fieldNames">;

const getOptionValue = (option: unknown, valueFieldName: string): unknown => {
	if (typeof option !== "object" || option === null) {
		return undefined;
	}

	return (option as Record<string, unknown>)[valueFieldName];
};

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
			loading: loadingProp,
			isLoading: isLoadingLegacyProp,
			cacheUniqs = defaultCacheUniqs,
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
			selectAllOption,
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
				// grouped options are left untouched — filtering their nested
				// options generically would also need GroupBase's own options
				// field name, not worth the complexity for this convenience prop
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

		// antd's onChange(value, option) always gives the full option object(s)
		// as the 2nd argument — that's what this library's value/onChange
		// contract has always exposed, so ignore the primitive 1st argument.
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
				ref={selectRef as Ref<never>}
			/>
		);
	}

	return WithAsyncPaginate;
}
