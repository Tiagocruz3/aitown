import type { Preview } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'

import './preview.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    docs: {
      // Inherit data-theme attribute set by the decorator so docs page styling
      // stays consistent with the active theme. No hardcoded palette here.
    },
  },

  /**
   * Theme toolbar — sets `data-theme="default-{light|dark}"` on the story root.
   * Quanta CSS hangs everything on that attribute, so this is the only switch
   * needed for token previews. Wrap each story in `bg-background-primary` /
   * `text-text-primary` so swatches without explicit colors render with the
   * theme's surface + foreground instead of Storybook's white canvas.
   */
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'default-light',
        dark: 'default-dark',
      },
      defaultTheme: 'dark',
      attributeName: 'data-theme',
    }),
    Story => (
      <div className="bg-q-background-tertiary text-q-text-primary min-h-screen p-6">
        <Story />
      </div>
    ),
  ],
}

export default preview
