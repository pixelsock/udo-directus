import {
  findChildrenInRange,
  mergeAttributes,
  Node,
  nodeInputRule,
  Tracker,
} from '@tiptap/core'

export interface FigureOptions {
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      /**
       * Add a figure element
       */
      setFigure: (options: {
        src: string,
        alt?: string,
        title?: string,
        caption?: string,
        style?: string,
      }) => ReturnType,

      /**
       * Converts an image to a figure
       */
      imageToFigure: () => ReturnType,

      /**
       * Converts a figure to an image
       */
      figureToImage: () => ReturnType,
    }
  }
}

export const inputRegex = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

export const Figure = Node.create<FigureOptions>({
  name: 'figure',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'editor-figure',
      },
    }
  },

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
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style,
          };
        },
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
      'figure', this.options.HTMLAttributes,
      ['img', mergeAttributes(imgAttrs, { 
        draggable: false, 
        contenteditable: false,
        class: 'editor-image',
        style: style || undefined
      })],
      ['figcaption', { class: 'editor-figcaption' }, 0],
    ]
  },

  addCommands() {
    return {
      setFigure: ({ caption, ...attrs }) => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs,
            content: caption
              ? [{ type: 'text', text: caption }]
              : [],
          })
          // set cursor at end of caption field
          .command(({ tr, commands }) => {
            const { doc, selection } = tr
            const position = doc.resolve(selection.to - 2).end()

            return commands.setTextSelection(position)
          })
          .run()
      },

      imageToFigure: () => ({ tr, commands }) => {
        console.log('imageToFigure command called');
        const { doc, selection } = tr
        const { from, to } = selection
        const images = findChildrenInRange(doc, { from, to }, node => node.type.name === 'image')

        console.log('Found images:', images);

        if (!images.length) {
          console.log('No images found in selection');
          return false
        }

        const tracker = new Tracker(tr)

        return commands.forEach(images, ({ node, pos }) => {
          const mapResult = tracker.map(pos)

          if (mapResult.deleted) {
            return false
          }

          const range = {
            from: mapResult.position,
            to: mapResult.position + node.nodeSize,
          }

          console.log('Converting image to figure:', node.attrs);

          return commands.insertContentAt(range, {
            type: this.name,
            attrs: {
              src: node.attrs.src,
              alt: node.attrs.alt,
              title: node.attrs.title,
              style: node.attrs.style,
            },
            content: [{ type: 'text', text: 'Add your caption here...' }],
          })
        })
      },

      figureToImage: () => ({ tr, commands }) => {
        console.log('figureToImage command called');
        const { doc, selection } = tr
        const { from, to } = selection
        const figures = findChildrenInRange(doc, { from, to }, node => node.type.name === this.name)

        console.log('Found figures:', figures);

        if (!figures.length) {
          console.log('No figures found in selection');
          return false
        }

        const tracker = new Tracker(tr)

        return commands.forEach(figures, ({ node, pos }) => {
          const mapResult = tracker.map(pos)

          if (mapResult.deleted) {
            return false
          }

          const range = {
            from: mapResult.position,
            to: mapResult.position + node.nodeSize,
          }

          console.log('Converting figure to image:', node.attrs);

          return commands.insertContentAt(range, {
            type: 'image',
            attrs: {
              src: node.attrs.src,
              alt: node.attrs.alt,
              title: node.attrs.title,
              style: node.attrs.style,
            },
          })
        })
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          const [, alt, src, title] = match

          return { src, alt, title }
        },
      }),
    ]
  },
})

console.log('Figure extension created:', Figure); 