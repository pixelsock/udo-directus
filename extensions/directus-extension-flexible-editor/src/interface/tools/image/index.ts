import Image from '@tiptap/extension-image';
import { defineTool } from '../../lib/define-tool';
import customMessages from '../../i18n/custom-messages';
import ToolButton from './ToolButton.vue';
import { Figure } from './figure';
import { mergeAttributes, Editor } from '@tiptap/core';
import type { Command } from '@tiptap/core';

// Configure the base Image extension
const imageExtension = Image.configure({
  inline: false,
  allowBase64: false,
  HTMLAttributes: {
    class: 'editor-image',
  },
}).extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { style, ...imgAttrs } = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    
    return [
      'img', 
      mergeAttributes(imgAttrs, {
        class: 'editor-image',
        style: style || undefined,
        draggable: false,
        contenteditable: false
      })
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage: (options: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
      toggleImageCaption: () => ({ commands, state }: any) => {
        const { from, to } = state.selection;
        const images: Array<{ node: any, pos: number }> = [];
        
        state.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (node.type.name === 'image') {
            images.push({ node, pos });
          }
        });

        if (images.length === 0) return false;

        const image = images[0];
        if (!image) return false;
        
        // Convert image to figure with caption
        return commands.insertContentAt(
          { from: image.pos, to: image.pos + image.node.nodeSize },
          {
            type: 'figure',
            attrs: {
              src: image.node.attrs.src,
              alt: image.node.attrs.alt,
              title: image.node.attrs.title,
              style: image.node.attrs.style,
            },
            content: [{ type: 'text', text: '' }],
          }
        );
      },
    };
  },
});

export default defineTool({
  key: 'image',
  name: customMessages.tools.image,
  icon: 'image',
  extension: [imageExtension, Figure],
  toolbarButton: ToolButton,
  active: (editor: Editor) => editor.isActive('image') || editor.isActive('figure'),
  disabled: () => false,
}); 