import type { Select as AntdSelect, GetProp } from "antd";
import type { ReactElement, Ref, UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { highlightText } from "./highlightText";
import { OptionLabelWithTooltip } from "./OptionLabelWithTooltip";
import {
	buildSelectedValuesSet,
	everyOptionSelected,
	isGroupedOptions,
} from "./selectionUtils";
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
type AntdDropdownRender = GetProp<typeof AntdSelect, "dropdownRender">;

const defaultNoMoreOptionsContent = "No more options available";

let hideSelectedOptionsUniqCounter = 0;

function mergeSelectedOnTop<OptionType>(
	options: readonly unknown[],
	value: OptionType | readonly OptionType[] | null | undefined,
	valueFieldName: string,
): unknown[] {
	if (isGroupedOptions(options as unknown[])) {
		return options as unknown[];
	}

	const selected = value == null ? [] : Array.isArray(value) ? value : [value];
	if (selected.length === 0) {
		return options as unknown[];
	}

	const selectedValues = buildSelectedValuesSet(value, valueFieldName);

	const rest = (options as Record<string, unknown>[]).filter(
		(option) => !selectedValues.has(option[valueFieldName]),
	);

	return [...selected, ...rest];
}

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
			noMoreOptionsContent = defaultNoMoreOptionsContent,
			highlightSearchTerm = false,
			showSelectedOnTop = false,
			popupClassName,
			optionRender,
			dropdownRender: dropdownRenderProp,
			fieldNames,
			value,
			onChange,
			selectAllOption,

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
		const valueFieldName =
			(fieldNames as AntdFieldNames | undefined)?.value ?? "value";

		const selectedValues = useMemo(
			() => buildSelectedValuesSet(value, valueFieldName),
			[value, valueFieldName],
		);

		const loadedOptionsAreGrouped = isGroupedOptions(
			asyncPaginateProps.options as unknown[],
		);

		// hideSelectedOptions hides every selected option via CSS, so once
		// every currently loaded option is selected the popup runs out of
		// visible content before `hasMore` is exhausted — a real
		// `onPopupScroll` event would then never fire again to load the next
		// page. Detected directly from data (not DOM measurement, which would
		// silently break if antd renamed its internal scroll container), and
		// synthesizes the same load a real bottom-scroll would have
		// triggered.
		const allLoadedOptionsSelected =
			!loadedOptionsAreGrouped &&
			everyOptionSelected(
				asyncPaginateProps.options as unknown[],
				selectedValues,
				valueFieldName,
			);

		useEffect(() => {
			if (
				!hideSelectedOptions ||
				!asyncPaginateProps.menuIsOpen ||
				!asyncPaginateProps.hasMore ||
				asyncPaginateProps.isLoading ||
				!allLoadedOptionsSelected
			) {
				return;
			}

			asyncPaginateProps.handlePopupScroll({
				currentTarget: { scrollHeight: 0, clientHeight: 0, scrollTop: 0 },
			} as UIEvent<HTMLDivElement>);
		}, [
			hideSelectedOptions,
			asyncPaginateProps.menuIsOpen,
			asyncPaginateProps.hasMore,
			asyncPaginateProps.isLoading,
			asyncPaginateProps.handlePopupScroll,
			allLoadedOptionsSelected,
		]);

		// Built here (not in the Base hook) because it needs `value`, which is
		// a controlled prop only the HOC knows about — the Base hook only
		// deals with inputValue/menuIsOpen and has no concept of selection.
		const allOption = useMemo(
			() =>
				selectAllOption
					? selectAllOption(asyncPaginateProps.inputValue, {
							value,
							options: asyncPaginateProps.options,
							hasMore: asyncPaginateProps.hasMore,
						})
					: null,
			[
				selectAllOption,
				asyncPaginateProps.inputValue,
				asyncPaginateProps.options,
				asyncPaginateProps.hasMore,
				value,
			],
		);

		const optionsWithSelectAll = useMemo(
			() =>
				allOption
					? [allOption, ...(asyncPaginateProps.options as unknown[])]
					: asyncPaginateProps.options,
			[allOption, asyncPaginateProps.options],
		);

		// Pins selected option(s) to the top, ahead of whatever
		// mapOptionsForMenu already produced. Flat options only — bails out
		// (returns options unchanged) the moment it sees a grouped shape,
		// since "top of the menu" is ambiguous once options are grouped.
		const menuOptions = useMemo(
			() =>
				showSelectedOnTop
					? mergeSelectedOnTop(optionsWithSelectAll, value, valueFieldName)
					: optionsWithSelectAll,
			[showSelectedOnTop, optionsWithSelectAll, value, valueFieldName],
		);

		// hideSelectedOptions hides every selected option via CSS, so once
		// every currently loaded option is selected (and there's nothing left
		// to load) the dropdown looks empty even though it isn't. Flat
		// `options` only — bails out for grouped (`GroupBase[]`) options, same
		// as `mergeSelectedOnTop`.
		const showNoMoreOptionsPlaceholder =
			hideSelectedOptions &&
			!asyncPaginateProps.hasMore &&
			allLoadedOptionsSelected;

		const resolvedDropdownRender: AntdDropdownRender | undefined =
			showNoMoreOptionsPlaceholder
				? (menu) => (
						<>
							{dropdownRenderProp ? dropdownRenderProp(menu) : menu}
							<div
								style={{
									padding: "8px 12px",
									textAlign: "center",
									color: "rgba(0, 0, 0, 0.45)",
								}}
							>
								{noMoreOptionsContent}
							</div>
						</>
					)
				: dropdownRenderProp;

		const highlightOptions =
			highlightSearchTerm === true ? {} : highlightSearchTerm || undefined;

		const baseOptionRender: AntdOptionRender | undefined =
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

		// Antd sets a native `title` on the option node unconditionally, so the
		// browser tooltip appears even when the label isn't truncated. Wrap the
		// rendered label so `title` is only set (on hover) when the text actually
		// overflows its available width.
		const resolvedOptionRender: AntdOptionRender = (option, info) => {
			const rendered = baseOptionRender
				? baseOptionRender(option, info)
				: option.label;

			const rawLabel = (option.data as Record<string, unknown>)[labelFieldName];

			return (
				<OptionLabelWithTooltip
					label={rendered}
					title={typeof rawLabel === "string" ? rawLabel : undefined}
				/>
			);
		};

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
					dropdownRender={resolvedDropdownRender}
					options={menuOptions as never}
					value={value}
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
