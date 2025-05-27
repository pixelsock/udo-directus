import { defineTool } from '../../lib/define-tool';
import customMessages from '../../i18n/custom-messages';
import DocxImportButton from '../../components/DocxImportButton.vue';
import type { Editor } from '@tiptap/core';

export default defineTool({
    key: 'docxImport',
    name: customMessages.tools.docx_import,
    icon: 'file_upload',
    extension: [], // No TipTap extension needed, just functionality
    excludeFromOptions: false,
    toolbarButton: DocxImportButton,
    action: (editor: Editor) => {
        // Action will be handled by the custom toolbar button component
    },
    disabled: (editor: Editor) => false,
    active: (editor: Editor) => false,
});
