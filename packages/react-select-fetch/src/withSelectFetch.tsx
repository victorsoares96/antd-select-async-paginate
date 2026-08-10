import type { GetProp, Select as AntdSelect } from "antd";
import type { ReactElement } from "react";
import { useCallback } from "react";
import type {
	GroupBase,
	UseAsyncPaginateResult,
} from "react-select-async-paginate";
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
			onChange,
			...rest
		} = props;

		const asyncPaginateProps: UseAsyncPaginateResult<OptionType, Group> =
			useSelectFetch(rest, cacheUniqs);

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
				{...(rest as object)}
				options={asyncPaginateProps.options as never}
				searchValue={asyncPaginateProps.inputValue}
				onSearch={asyncPaginateProps.onInputChange}
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
