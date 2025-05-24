import { defineInterface } from '@directus/extensions-sdk';
import BlockEditor from './interface.vue';

export default defineInterface({
	id: 'block-editor',
	name: 'Block Editor',
	icon: 'article',
	description: 'A Notion-like block editor with rich formatting and slash commands',
	component: BlockEditor,
	options: [
		{
			field: 'placeholder',
			name: 'Placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					placeholder: 'Enter placeholder text...',
				},
			},
		},
		{
			field: 'toolbar',
			name: 'Show Toolbar',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'slashCommands',
			name: 'Enable Slash Commands',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
			schema: {
				default_value: true,
			},
		},
	],
	types: ['json', 'text'],
	group: 'standard',
}); 