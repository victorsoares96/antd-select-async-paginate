# antd-select-async-paginate

Wrapper above antd's `Select` that supports pagination on menu scroll.

Forked from [react-select-async-paginate](https://github.com/vtaits/react-select-async-paginate), rebuilt on top of [antd](https://ant.design/)'s `Select` instead of `react-select`.

## Versions

| antd | antd-select-async-paginate |
|------|------------------------------|
| 5.x  | 0.1.x                        |

## Installation

```
npm install antd antd-select-async-paginate
```

or

```
yarn add antd antd-select-async-paginate
```

or

```
bun add antd antd-select-async-paginate
```

## Usage

`AsyncPaginate` is a wrapper above antd's `Select` that supports loading options page by page. It accepts all props of antd's `Select`, plus some new ones:

### loadOptions

Required. Async function that takes the next arguments:

1. Current value of search input.
2. Loaded options for current search.
3. Collected additional data e.g. current page number etc. For first load it is `additional` from props, for next is `additional` from previous response for current search. `undefined` by default.

It should return next object:

```
{
  options: Array,
  hasMore: boolean,
  additional?: any,
}
```

### debounceTimeout

Not required. Number. Debounce timeout for `loadOptions` calls. `0` by default.

### additional

Not required. Default `additional` for first request for every search.

### defaultAdditional

Not required. Default `additional` for empty search if `options` or `defaultOptions` defined.

### shouldLoadMore

Not required. Function. By default new options will load only after scrolling the popup to the bottom. Arguments:

- scrollHeight
- clientHeight
- scrollTop

Should return boolean.

### reduceOptions

Not required. Function. By default new loaded options are concatenated with the previous ones. Arguments:

- previous options
- loaded options
- next additional

Should return new options.

### reloadOnErrorTimeout

Not required. Number. Time in milliseconds to retry a request after an error.

### clearCacheOnSearchChange

Not required. Boolean. Clear all cached options on search change.

### clearCacheOnMenuClose

Not required. Boolean. Clear all cached options on menu close.

### cacheUniqs

Not required. Array. Works as 2nd argument of `useEffect` hook. When one of items changed, `AsyncPaginate` cleans all cached options.

### loadOptionsOnMenuOpen

Not required. Boolean. If `false` options will not load on menu opening.

### mapOptionsForMenu

Not required. Function. Post-mapping of loaded options to display them in the menu. Can be used to put selected options to top of the list.

### selectRef

Ref for the underlying antd `Select` instance.

### isMulti

Not required. Boolean. Convenience for antd's `mode="multiple"`, matching react-select's `isMulti` convention. Ignored if `mode` is passed explicitly.

### selectAllOption

Not required. Function `(inputValue: string) => OptionType | null`. Builds a synthetic "select all" option prepended to the menu (after `mapOptionsForMenu`), called on every render with the current search value so the option can encode it (e.g. an "All matching…" option), or return `null` to show nothing. This library has no default "select all" value shape — you own it entirely, so it's opt-in and never collides with real option values.

Pair it with the exported `resolveSelectAllChange` helper in your `onChange` to make selecting it mutually exclusive with individual options (selecting "all" drops other selections and vice versa):

```javascript
import { AsyncPaginate, resolveSelectAllChange } from 'antd-select-async-paginate';

const isSelectAllOption = (option) => option.value.startsWith('__all__');

const selectAllOption = (inputValue) =>
  inputValue
    ? { value: `__all__:${inputValue}`, label: `All matching "${inputValue}"` }
    : { value: '__all__', label: 'All' };

<AsyncPaginate
  mode="multiple"
  value={value}
  loadOptions={loadOptions}
  selectAllOption={selectAllOption}
  onChange={(nextValue) => {
    const nextArray = Array.isArray(nextValue) ? nextValue : nextValue ? [nextValue] : [];
    setValue(resolveSelectAllChange(value, nextArray, isSelectAllOption));
  }}
/>
```

See the `Select all option` story in `__stories__` for a complete example.

## Differences from react-select-async-paginate

If you're migrating from `react-select-async-paginate`:

- Peer dependency is `antd ^5` instead of `react-select ^5`.
- Infinite scroll uses antd's native `onPopupScroll` — no more `wrapMenuList`/`useComponents` `MenuList`-wrapping workaround.
- `filterOption` follows antd's signature: `(inputValue, option) => boolean`, defaults to `false` (no client-side filtering, since search is expected to be driven by `loadOptions`). Antd's grouped options and custom label/value field names are configured via the `fieldNames` prop instead of `getOptionLabel`/`getOptionValue`.
- `onInputChange` no longer receives a second `actionMeta` argument (antd's `onSearch` only gives the new value).
- `menuPlacement`/`menuShouldScrollIntoView` are gone — use antd's `placement` prop.
- `value`/`onChange` still always carry the full option object (single) or array of full option objects (multi) — this contract is unchanged from `react-select-async-paginate`, implemented internally by reading the 2nd argument of antd's `onChange(value, option)`.
- Virtual scrolling (antd's `virtual` prop) defaults to `false`, to keep every loaded option present in the DOM the way `react-select` always did. Pass `virtual` explicitly to opt back in.
- antd has no `Creatable` select — see the `Creatable`/`CreatableWithNewOptions` stories in `__stories__` for a DIY pattern using `notFoundContent`.

## Example

### offset way

```javascript
import { AsyncPaginate } from 'antd-select-async-paginate';

...

/*
 * assuming the API returns something like this:
 *   const json = {
 *     results: [
 *       {
 *         value: 1,
 *         label: 'Audi',
 *       },
 *       {
 *         value: 2,
 *         label: 'Mercedes',
 *       },
 *       {
 *         value: 3,
 *         label: 'BMW',
 *       },
 *     ],
 *     has_more: true,
 *   };
 */

async function loadOptions(search, loadedOptions) {
  const response = await fetch(`/awesome-api-url/?search=${search}&offset=${loadedOptions.length}`);
  const responseJSON = await response.json();

  return {
    options: responseJSON.results,
    hasMore: responseJSON.has_more,
  };
}

<AsyncPaginate
  value={value}
  loadOptions={loadOptions}
  onChange={setValue}
/>
```

### page way

```javascript
import { AsyncPaginate } from 'antd-select-async-paginate';

...

async function loadOptions(search, loadedOptions, { page }) {
  const response = await fetch(`/awesome-api-url/?search=${search}&page=${page}`);
  const responseJSON = await response.json();

  return {
    options: responseJSON.results,
    hasMore: responseJSON.has_more,
    additional: {
      page: page + 1,
    },
  };
}

<AsyncPaginate
  value={value}
  loadOptions={loadOptions}
  onChange={setValue}
  additional={{
    page: 1,
  }}
/>
```

## Grouped options

You can use `reduceGroupedOptions` util to group options by `label` key.

```javascript
import { AsyncPaginate, reduceGroupedOptions } from 'antd-select-async-paginate';

/*
 * assuming the API returns something like this:
 *   const json = {
 *     options: [
 *       label: 'Cars',
 *       options: [
 *         {
 *           value: 1,
 *           label: 'Audi',
 *         },
 *         {
 *           value: 2,
 *           label: 'Mercedes',
 *         },
 *         {
 *           value: 3,
 *           label: 'BMW',
 *         },
 *       ]
 *     ],
 *     hasMore: true,
 *   };
 */

...

<AsyncPaginate
  {...otherProps}
  reduceOptions={reduceGroupedOptions}
/>
```

## Replacing antd's Select component

You can use `withAsyncPaginate` HOC to build a pagination-aware wrapper around any antd-`Select`-compatible component.

```javascript
import { withAsyncPaginate } from 'antd-select-async-paginate';
import { Select } from 'antd';

...

const CustomAsyncPaginate = withAsyncPaginate(Select);
```

## Extended usage

If you want to construct your own component that uses the logic of `antd-select-async-paginate` inside, you can use next hooks:

- `useAsyncPaginate`
- `useAsyncPaginateBase`

```javascript
import { Select } from 'antd';
import { useAsyncPaginate } from 'antd-select-async-paginate';

...

const CustomAsyncPaginateComponent = ({
  options,
  defaultOptions,
  additional,
  loadOptionsOnMenuOpen,
  debounceTimeout,
  filterOption,
  reduceOptions,
  shouldLoadMore,

  value,
  onChange,
}) => {
  const asyncPaginateProps = useAsyncPaginate({
    options,
    defaultOptions,
    additional,
    loadOptionsOnMenuOpen,
    debounceTimeout,
    filterOption,
    reduceOptions,
    shouldLoadMore,
  });

  return (
    <Select
      options={asyncPaginateProps.options}
      searchValue={asyncPaginateProps.inputValue}
      onSearch={asyncPaginateProps.onInputChange}
      open={asyncPaginateProps.menuIsOpen}
      onOpenChange={(open) => (open ? asyncPaginateProps.onMenuOpen() : asyncPaginateProps.onMenuClose())}
      onPopupScroll={asyncPaginateProps.handlePopupScroll}
      filterOption={asyncPaginateProps.filterOption}
      loading={asyncPaginateProps.isLoading}
      value={value}
      onChange={(_value, option) => onChange(option)}
    />
  );
}
```
