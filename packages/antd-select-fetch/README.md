# antd-select-fetch

Wrapper above `antd-select-async-paginate` that loads options from specified url.

Forked from [react-select-fetch](https://github.com/vtaits/react-select-async-paginate/tree/master/packages/react-select-fetch), rebuilt on top of [antd](https://ant.design/)'s `Select` instead of `react-select`.

## Installation

```
npm install antd antd-select-async-paginate antd-select-fetch
```

or

```
yarn add antd antd-select-async-paginate antd-select-fetch
```

or

```
bun add antd antd-select-async-paginate antd-select-fetch
```

## Motivation

Abstractions are wonderful but the most common task for async select is load list of options by specified url and query params. E.g.

```javascript
// With SelectFetch

import { SelectFetch } from 'antd-select-fetch';

...

<SelectFetch
  value={value}
  url="/awesome-api-url/"
  mapResponse={(response) => ({
    options: response.results,
    hasMore: response.has_more,
  })}
  onChange={setValue}
/>
```

```javascript
// Without SelectFetch

import { AsyncPaginate } from 'antd-select-async-paginate';

...

<AsyncPaginate
  value={value}
  loadOptions={async (search, loadedOptions, { page }) => {
    const response = await fetch(`/awesome-api-url/?search=${search}&page=${page}`);
    const responseJSON = await response.json();

    return {
      options: responseJSON.results,
      hasMore: responseJSON.has_more,
      additional: {
        page: page + 1,
      },
    };
  }}
  onChange={setValue}
  additional={{
    page: 1,
  }}
/>
```

## Props

`SelectFetch` receives props of antd's `Select` and `antd-select-async-paginate`. And there are some new props:

### url

Required. String.

### queryParams

Not required. Object. Object of permanent query params for requests.

### searchParamName

Not required. String. Name of param that contains value of search input. `"search"` by default.

### pageParamName

Not required. String. Name of param that contains index of loaded page. Starts from `1`. `"page"` by default.

### offsetParamName

Not required. String. Name of param that contains number of loaded optons. `"offset"` by default.

### mapResponse

Not required. Function. Mapper from server's response to format of `antd-select-async-paginate`. Arguments:

  1. `response` - response of server;

  2. `payload` - object:

    - `payload.search` - current search;
    - `payload.prevPage` - page number before requrest;
    - `payload.prevOptions` - options before request;

### initialPage

Not required. Page number for first request for every search. `1` by default.

### defaultInitialPage

Not required. Page number for first request for empty search if `options` or `defaultOptions` defined. `2` by default.

### get

Not required. Async function. Arguments:

1. url;
2. object of query params;

Should return parsed response of server.

Example with `axios`:

```javascript
import axios from 'axios';

...

const get = async (url, params) => {
  const response = await axios.get(url, {
    params,
  });

  return response.data;
};
```

## Replacing antd's Select component

You can use `withSelectFetch` HOC.

```javascript
import { withSelectFetch } from 'antd-select-fetch';
import { Select } from 'antd';

...

const CustomSelectFetch = withSelectFetch(Select);
```

## Differences from react-select-fetch

See the [antd-select-async-paginate README](../antd-select-async-paginate/README.md#differences-from-react-select-async-paginate) — the same API changes (peer dependency, `filterOption`, `onInputChange`, `placement`, no `Creatable`) apply here since `SelectFetch` is built the same way as `AsyncPaginate`.
