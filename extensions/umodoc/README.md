# Umo Editor Extension for Directus

A bundle extension that provides a rich document editor interface and display for Directus, powered by [Umo Editor](https://editor.umodoc.com/).

## Features

- **Rich Text Editing**: Full-featured document editor with comprehensive formatting options
- **Vue 3 + UmoEditor**: Built with the actual UmoEditor component (which uses Tiptap under the hood)
- **Directus Integration**: Seamlessly integrates with Directus field types and theming
- **Extensible Configuration**: Customizable via JSON settings with comprehensive default options
- **Multiple Display Formats**: View content as HTML, plain text, or raw JSON
- **Responsive Design**: Works perfectly in Directus's responsive interface
- **Advanced Features**: Supports toolbars, page layouts, AI assistance, file uploads, and more

## Components

This bundle includes two extensions:

### 1. Umo Editor Interface (`umo-editor-interface`)
A rich text editing interface for content creation and editing.

**Supported Field Types:**
- `JSON` (recommended)

**Configuration Options:**
- **Placeholder**: Custom placeholder text when empty
- **Read Only**: Make the editor read-only
- **Editor Settings**: JSON configuration for editor behavior and features

### 2. Umo Editor Display (`umo-editor-display`)
A display component for rendering Umo Editor content in different formats.

**Display Options:**
- **Rich Text (HTML)**: Renders content as formatted HTML
- **Plain Text**: Extracts and displays plain text only
- **Raw JSON**: Shows the raw JSON structure
- **Maximum Length**: Optionally truncate long content

## Installation

1. Copy the built extension to your Directus extensions directory:
   ```bash
   cp -r dist/ /path/to/directus/extensions/umodoc/
   ```

2. Restart your Directus instance to load the extension.

## Usage

### Setting up a Field

1. In your Directus collection, create a new field
2. Set the field type to "JSON"
3. Choose "Umo Editor" as the interface
4. Configure the interface options as needed
5. Optionally set the display to "Umo Editor Display"

### Configuration Examples

The interface provides a **clickable template button** (plus `+` icon) for the Editor Settings field, following Directus's native "Fill with Template Value" pattern. When configuring the interface, you'll see a plus icon next to the JSON field that you can click to populate the field with comprehensive default values. The field starts empty and is only populated when you explicitly click the template button.

#### Default Editor Settings (Complete Configuration)
```json
{
  "editorKey": "default",
  "locale": "en-US",
  "theme": "light",
  "height": "100%",
  "toolbar": {
    "defaultMode": "ribbon",
    "menus": ["base", "insert", "table", "tools"],
    "disableMenuItems": []
  },
  "page": {
    "defaultMargin": {
      "left": 3.18,
      "right": 3.18,
      "top": 2.54,
      "bottom": 2.54
    },
    "defaultOrientation": "portrait",
    "defaultBackground": "#fff",
    "showBreakMarks": true
  },
  "document": {
    "title": "",
    "content": "",
    "placeholder": "Please enter the document content...",
    "enableSpellcheck": true,
    "enableMarkdown": true,
    "enableBubbleMenu": true,
    "enableBlockMenu": true,
    "readOnly": false,
    "autofocus": true,
    "characterLimit": 0
  },
  "ai": {
    "assistant": {
      "enabled": false,
      "maxlength": 100
    }
  },
  "file": {
    "allowedMimeTypes": [],
    "maxSize": 104857600
  }
}
```

#### Custom Configuration Example
You can customize any part of the configuration as needed:
```json
{
  "editorKey": "my-custom-editor",
  "locale": "en-US",
  "theme": "dark",
  "height": "600px",
  "toolbar": {
    "defaultMode": "classic",
    "menus": ["base", "insert"],
    "disableMenuItems": ["emoji", "table"]
  },
  "page": {
    "showBreakMarks": false,
    "defaultBackground": "#f8f9fa"
  },
  "document": {
    "enableSpellcheck": false,
    "enableMarkdown": true,
    "placeholder": "Start writing your document..."
  }
}
```

## Development

### Building from Source

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. For development with hot reloading:
   ```bash
   npm run dev
   ```

### Project Structure

```
src/
├── interface/           # Interface extension
│   ├── index.ts        # Interface definition
│   └── interface.vue   # Vue component
└── display/            # Display extension
    ├── index.ts        # Display definition
    └── display.vue     # Vue component
```

## Technical Implementation

This extension now properly uses the actual **UmoEditor** component directly, rather than a Tiptap reimplementation. UmoEditor itself is built on top of Tiptap, but provides a much richer interface.

### Current Features (v6.1.1)
- ✅ **Core rich text editing** with formatting toolbar
- ✅ **Ribbon/Classic toolbar modes** 
- ✅ **Basic page layout controls**
- ✅ **AI assistance** (configurable)
- ✅ **File upload handling**
- ✅ **Spellcheck & Markdown support**
- ✅ **Bubble and block menus**

### Version Compatibility Notes
The extension is configured for UmoEditor v6.1.1 compatibility. Some advanced features shown in newer documentation (like `aside` panels, advanced watermarks, etc.) are not available in this version but can be added when upgrading to newer versions of `@umoteam/editor`.

## Dependencies

- `@umoteam/editor`: ^6.1.1 - The core Umo Editor library
- `@directus/extensions-sdk`: ^13.1.0 - Directus extension SDK
- `vue`: ^3.5.14 - Vue 3 framework

## Compatibility

- **Directus**: ^10.10.0
- **Vue**: ^3.x
- **Node.js**: >=18.0.0

## Documentation

For more information about Umo Editor features and configuration options, visit the [official documentation](https://editor.umodoc.com/).

## License

This extension is provided under the same terms as Umo Editor. Please refer to the Umo Editor documentation for licensing information.

## Support

For issues related to this Directus extension, please check the project repository.
For Umo Editor specific issues, please refer to the [Umo Editor documentation](https://editor.umodoc.com/) or their support channels. 