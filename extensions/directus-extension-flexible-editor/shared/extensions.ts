// Used for `/content` and `/src/display`
// Add only extensions that are necessary for rendering the content

import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import Paragraph from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import CodeBlock from "@tiptap/extension-code-block";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import {
  findChildrenInRange,
  mergeAttributes,
  Node,
  nodeInputRule,
  Tracker,
} from '@tiptap/core'

// Figure node for images with captions
const Figure = Node.create({
  name: 'figure',

  group: 'block',

  content: 'inline*',  // This allows all inline content including formatting marks

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('src'),
      },

      alt: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('alt'),
      },

      title: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('title'),
      },

      style: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('style'),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { style, ...imgAttrs } = HTMLAttributes;
    return [
      'figure', { class: 'editor-figure' },
      ['img', mergeAttributes(imgAttrs, { 
        draggable: false, 
        contenteditable: false,
        class: 'editor-image',
        style: style || undefined
      })],
      ['figcaption', { class: 'editor-figcaption' }, 0],
    ]
  },
});

export default [
    Document,
    Text,
    Paragraph,
    HardBreak,
    Heading,
    CodeBlock,
    BulletList,
    OrderedList,
    ListItem,
    Blockquote,
    HorizontalRule,
    Link,
    Bold,
    Italic,
    Strike,
    Code,
    Subscript,
    Superscript,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TextAlign,
    Figure,
    Image.configure({
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
    }),
];
