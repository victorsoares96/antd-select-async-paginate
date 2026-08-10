A set of components that make working with asynchronous selects based on antd's `Select` easier.

Forked from [react-select-async-paginate](https://github.com/vtaits/react-select-async-paginate), rebuilt on top of [antd](https://ant.design/)'s `Select` (which is built on `rc-select`) instead of `react-select`.

## Packages

- [antd-select-async-paginate](https://github.com/victorsoares96/antd-select-async-paginate/tree/master/packages/antd-select-async-paginate) - wrapper above antd's `Select` that supports pagination on menu scroll.

- [antd-select-fetch](https://github.com/victorsoares96/antd-select-async-paginate/tree/master/packages/antd-select-fetch) - wrapper above antd-select-async-paginate that loads options from specified url.

## Local development

Repository is using [bun](https://bun.sh/).

### Commands

- `bun run build` - build all packages;

- `bun run test` - run code validators and unit tests;

- `bun run start` - start [storybook](https://storybook.js.org/) with examples.
