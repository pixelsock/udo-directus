import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'pdf-to-html-interface',
	name: 'PDF to HTML',
	icon: 'transform',
	description: 'Convert PDF files to formatted HTML',
	component: InterfaceComponent,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: ({ collection }: { collection: string }) => {
		return [
			{
				field: 'file_field',
				type: 'string',
				name: 'PDF Field',
				meta: {
					width: 'half',
					interface: 'system-field',
					options: {
						collectionName: collection,
						typeAllowList: ['uuid'],
					},
				},
			},
			{
				field: 'target_field',
				type: 'string',
				name: 'Target HTML Field',
				meta: {
					width: 'half',
					interface: 'system-field',
					options: {
						collectionName: collection,
						typeAllowList: ['text', 'string'],
					},
				},
			},
			{
				field: 'button_label',
				name: 'Button Label',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: { placeholder: 'Convert PDF to HTML' },
				},
				schema: {
					default_value: 'Convert PDF to HTML',
				},
			},
		];
	},
});