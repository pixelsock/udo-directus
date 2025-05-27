import DocxImport from '@custom-editor/docx-import';
import { defineTool } from '../../lib';
import customMessages from '../i18n/custom-messages';
import type { Editor } from '@tiptap/core';

export default defineTool({
    key: 'docxImport',
    name: customMessages.tools.docx_import,
    icon: 'upload_file',
    extension: [DocxImport],
    action: (editor: Editor) => editor.chain().focus().docxImport().run(),
    disabled: (editor: Editor) => !editor.can().chain().focus().docxImport().run(),
    active: () => false,
});
