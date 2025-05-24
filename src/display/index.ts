import { defineDisplay } from '@directus/extensions-sdk';
import BlockDisplay from './display.vue';

export default defineDisplay({
	id: 'block-display',
	name: 'Block Display',
	icon: 'article',
	description: 'Display rich content from the block editor',
	component: BlockDisplay,
	options: [
		{
			field: 'maxLength',
			name: 'Max Length',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'input',
			},
			schema: {
				default_value: null,
			},
		},
	],
	types: ['json', 'text'],
}); 