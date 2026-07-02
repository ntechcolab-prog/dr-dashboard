import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  // MDX overview/docs pages first, then stories colocated next to components.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    // Keep builds fast/robust — don't fail the whole build on a prop-types
    // reaction check; docs still infer args from the TS component signatures.
    reactDocgen: 'react-docgen-typescript',
  },
}

export default config
