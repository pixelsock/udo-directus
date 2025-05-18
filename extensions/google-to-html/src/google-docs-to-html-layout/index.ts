import { defineLayout } from '@directus/extensions-sdk';
import GoogleDocsToHtmlLayout from './GoogleDocsToHtmlLayout.vue';

export default defineLayout({
  id: 'google-docs-to-html',
  name: 'Google Docs to HTML',
  icon: 'text_format',
  component: GoogleDocsToHtmlLayout,
  slots: {
    options: () => import('./LayoutOptions.vue'),
  },
  setup: (props) => {
    return { props };
  },
});