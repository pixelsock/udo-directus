import InterfaceComponent from './interface.vue';

export default {
  id: 'pdf-viewer',
  name: 'PDF Viewer',
  icon: 'picture_as_pdf',
  description: 'Preview PDF files directly in the interface',
  component: InterfaceComponent,
  options: [
    {
      field: 'height',
      name: 'Height',
      type: 'integer',
      meta: {
        width: 'half',
        interface: 'input',
        options: {
          placeholder: 'e.g. 500',
        },
      },
      schema: {
        default_value: 500,
      },
    },
  ],
  types: ['uuid', 'string', 'text'],
  localTypes: ['file'],
  group: 'standard',
};
