import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../packages/**/*.stories.@(js|jsx|ts|tsx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-docs'],
  docs: {
    defaultName: 'Docs',
  },
};

export default config;
