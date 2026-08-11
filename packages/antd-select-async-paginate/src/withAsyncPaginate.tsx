import type { Select as AntdSelect, GetProp } from "antd";
import type { ReactElement, Ref } from "react";
import { useCallback, useRef } from "react";
import { highlightText } from "./highlightText";
import type {
	AsyncPaginateProps,
	GroupBase,
	UseAsyncPaginateResult,
	WithAsyncPaginateType,
} from "./types";
import { useAsyncPaginate } from "./useAsyncPaginate";

const defaultCacheUniqs: unknown[] = [];

type AntdOnChange = GetProp<typeof AntdSelect, "onChange">;
type AntdOptionRender = GetProp<typeof AntdSelect, "optionRender">;
type AntdFieldNames = GetProp<typeof AntdSelect, "fieldNames">;

let hideSelectedOptionsUniqCounter = 0;

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
			highlightSearchTerm = false,
			popupClassName,
			optionRender,
			fieldNames,
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

		// hideSelectedOptions must NOT remove selected options from the
		// `options` array handed to antd: rc-select rebuilds each selected
		// option's full data from the current `options` list on every
		// onChange (proven by an earlier bug — see resolveSelectAllChange),
		// so an option missing from `options` degrades to an incomplete
		// object as soon as another option is picked. Hiding is done with a
		// scoped CSS rule instead, keeping `options` — and antd's internal
		// value tracking — fully intact.
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
					ref={selectRef as Ref<never>}
				/>
			</>
		);
	}

	return WithAsyncPaginate;
}
