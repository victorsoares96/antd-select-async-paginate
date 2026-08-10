import { Select } from "antd";
import { withAsyncPaginate } from "./withAsyncPaginate";

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
