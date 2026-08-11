import { Select } from "antd";
import { withAsyncPaginate } from "./withAsyncPaginate";

export { createSelectAllOption } from "./createSelectAllOption";
export type { HighlightTextOptions } from "./highlightText";
export { highlightText } from "./highlightText";
export { reduceGroupedOptions } from "./reduceGroupedOptions";
export { resolveSelectAllChange } from "./resolveSelectAllChange";

export { withAsyncPaginate };

export { useAsyncPaginate } from "./useAsyncPaginate";
export { useAsyncPaginateBase } from "./useAsyncPaginateBase";
export {
	checkIsResponse,
	validateResponse,
} from "./validateResponse";

export const AsyncPaginate = withAsyncPaginate(Select);

export * from "./types";
