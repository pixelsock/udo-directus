import { defineModule } from '@directus/extensions-sdk';
import GoogleDocsToHtmlComponent from './GoogleDocsToHtml.vue';

export default defineModule({
  id: 'google-docs-to-html',
  name: 'Google Docs to HTML',
  icon: 'content_paste',
  routes: [
    {
      path: '',
      component: GoogleDocsToHtmlComponent,
    },
  ],
  // Add navigation configuration to make it appear in sidebar
  navigation: {
    icon: 'text_format',
    name: 'Google Docs to HTML',
  },
});