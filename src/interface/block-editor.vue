<template>
	<div class="block-editor">
		<!-- Toolbar -->
		<div v-if="toolbar" class="editor-toolbar">
			<button 
				v-for="tool in toolbarItems" 
				:key="tool.name"
				@click="tool.action"
				:class="{ active: tool.isActive?.() }"
				class="toolbar-button"
				:title="tool.title"
			>
				{{ tool.name }}
			</button>
		</div>

		<!-- Editor Container -->
		<div 
			ref="editorContainer" 
			class="editor-container"
			:class="{ 'with-toolbar': toolbar }"
		></div>

		<!-- Slash Command Menu -->
		<div 
			v-if="showSlashMenu" 
			class="slash-menu"
			:style="slashMenuStyle"
		>
			<div 
				v-for="(command, index) in filteredSlashCommands" 
				:key="command.name"
				@click="executeSlashCommand(command)"
				:class="{ selected: index === selectedSlashIndex }"
				class="slash-command"
			>
				<span class="command-icon">{{ command.icon }}</span>
				<div>
					<div class="command-name">{{ command.name }}</div>
					<div class="command-description">{{ command.description }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';

interface Props {
	value?: string | null;
	placeholder?: string;
	toolbar?: boolean;
	slashCommands?: boolean;
	disabled?: boolean;
}

interface Emits {
	(event: 'input', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
	value: '',
	placeholder: 'Type / for commands...',
	toolbar: true,
	slashCommands: true,
	disabled: false,
});

const emit = defineEmits<Emits>();

// Template refs
const editorContainer = ref<HTMLElement>();

// Editor state
let editorView: EditorView | null = null;
let editorSchema: Schema;

// Slash commands
const showSlashMenu = ref(false);
const slashMenuStyle = ref({});
const selectedSlashIndex = ref(0);
const slashQuery = ref('');

// Create enhanced schema with lists
const schema = new Schema({
	nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
	marks: basicSchema.spec.marks,
});

editorSchema = schema;

// Slash commands configuration
const slashCommands = [
	{
		name: 'Heading 1',
		description: 'Large section heading',
		icon: 'H1',
		keywords: ['h1', 'heading', 'title'],
		action: () => setBlockType('heading', { level: 1 }),
	},
	{
		name: 'Heading 2',
		description: 'Medium section heading',
		icon: 'H2',
		keywords: ['h2', 'heading'],
		action: () => setBlockType('heading', { level: 2 }),
	},
	{
		name: 'Heading 3',
		description: 'Small section heading',
		icon: 'H3',
		keywords: ['h3', 'heading'],
		action: () => setBlockType('heading', { level: 3 }),
	},
	{
		name: 'Paragraph',
		description: 'Plain text paragraph',
		icon: 'P',
		keywords: ['p', 'paragraph', 'text'],
		action: () => setBlockType('paragraph'),
	},
	{
		name: 'Bullet List',
		description: 'Unordered list with bullets',
		icon: '•',
		keywords: ['ul', 'list', 'bullet'],
		action: () => setBlockType('bullet_list'),
	},
	{
		name: 'Numbered List',
		description: 'Ordered list with numbers',
		icon: '1.',
		keywords: ['ol', 'list', 'numbered'],
		action: () => setBlockType('ordered_list'),
	},
	{
		name: 'Blockquote',
		description: 'Quote or citation',
		icon: '"',
		keywords: ['quote', 'blockquote', 'citation'],
		action: () => setBlockType('blockquote'),
	},
];

// Filtered slash commands based on query
const filteredSlashCommands = ref(slashCommands);

// Toolbar configuration
const toolbarItems = [
	{
		name: 'B',
		title: 'Bold',
		action: () => toggleMark('strong'),
		isActive: () => isMarkActive('strong'),
	},
	{
		name: 'I',
		title: 'Italic',
		action: () => toggleMark('em'),
		isActive: () => isMarkActive('em'),
	},
	{
		name: 'H1',
		title: 'Heading 1',
		action: () => setBlockType('heading', { level: 1 }),
		isActive: () => isBlockActive('heading', { level: 1 }),
	},
	{
		name: 'H2',
		title: 'Heading 2',
		action: () => setBlockType('heading', { level: 2 }),
		isActive: () => isBlockActive('heading', { level: 2 }),
	},
	{
		name: 'H3',
		title: 'Heading 3',
		action: () => setBlockType('heading', { level: 3 }),
		isActive: () => isBlockActive('heading', { level: 3 }),
	},
	{
		name: '•',
		title: 'Bullet List',
		action: () => setBlockType('bullet_list'),
		isActive: () => isBlockActive('bullet_list'),
	},
	{
		name: '1.',
		title: 'Numbered List',
		action: () => setBlockType('ordered_list'),
		isActive: () => isBlockActive('ordered_list'),
	},
	{
		name: '"',
		title: 'Blockquote',
		action: () => setBlockType('blockquote'),
		isActive: () => isBlockActive('blockquote'),
	},
];

// Initialize editor
const initializeEditor = () => {
	if (!editorContainer.value) return;

	const doc = parseContent(props.value || '');
	
	const state = EditorState.create({
		doc,
		plugins: [
			...exampleSetup({ schema: editorSchema, menuBar: false }),
			keymap({
				...baseKeymap,
				'/': handleSlashCommand,
				'Escape': hideSlashMenu,
				'ArrowUp': handleSlashNavigation('up'),
				'ArrowDown': handleSlashNavigation('down'),
				'Enter': handleSlashEnter,
			}),
			history(),
		],
	});

	editorView = new EditorView(editorContainer.value, {
		state,
		dispatchTransaction: (transaction) => {
			if (!editorView) return;
			
			const newState = editorView.state.apply(transaction);
			editorView.updateState(newState);
			
			// Emit changes
			if (transaction.docChanged) {
				const content = serializeContent(newState.doc);
				emit('input', content);
			}
		},
		attributes: {
			class: 'editor-content',
			'data-placeholder': props.placeholder,
		},
	});
};

// Parse content from JSON or HTML
const parseContent = (content: string) => {
	if (!content) {
		return editorSchema.node('doc', null, [
			editorSchema.node('paragraph', null, [])
		]);
	}

	try {
		// Try to parse as JSON first
		const json = JSON.parse(content);
		return editorSchema.nodeFromJSON(json);
	} catch {
		// Fall back to HTML parsing
		const div = document.createElement('div');
		div.innerHTML = content;
		return DOMParser.fromSchema(editorSchema).parse(div);
	}
};

// Serialize content to JSON
const serializeContent = (doc: any) => {
	return JSON.stringify(doc.toJSON());
};

// Mark and block type helpers
const toggleMark = (markType: string) => {
	if (!editorView) return;
	
	const mark = editorSchema.marks[markType];
	if (!mark) return;
	
	const { state, dispatch } = editorView;
	const { from, to } = state.selection;
	
	if (state.doc.rangeHasMark(from, to, mark)) {
		dispatch(state.tr.removeMark(from, to, mark));
	} else {
		dispatch(state.tr.addMark(from, to, mark.create()));
	}
};

const isMarkActive = (markType: string) => {
	if (!editorView) return false;
	
	const mark = editorSchema.marks[markType];
	if (!mark) return false;
	
	const { from, to } = editorView.state.selection;
	return editorView.state.doc.rangeHasMark(from, to, mark);
};

const setBlockType = (nodeType: string, attrs?: any) => {
	if (!editorView) return;
	
	const node = editorSchema.nodes[nodeType];
	if (!node) return;
	
	const { state, dispatch } = editorView;
	dispatch(state.tr.setBlockType(state.selection.from, state.selection.to, node, attrs));
	hideSlashMenu();
};

const isBlockActive = (nodeType: string, attrs?: any) => {
	if (!editorView) return false;
	
	const node = editorSchema.nodes[nodeType];
	if (!node) return false;
	
	const { $from } = editorView.state.selection;
	const parent = $from.parent;
	
	if (parent.type !== node) return false;
	if (!attrs) return true;
	
	return Object.keys(attrs).every(key => parent.attrs[key] === attrs[key]);
};

// Slash command handlers
const handleSlashCommand = (state: any, dispatch: any) => {
	if (!props.slashCommands) return false;
	
	showSlashMenu.value = true;
	selectedSlashIndex.value = 0;
	slashQuery.value = '';
	filteredSlashCommands.value = slashCommands;
	
	// Position the slash menu
	nextTick(() => {
		if (!editorView) return;
		
		const coords = editorView.coordsAtPos(state.selection.from);
		slashMenuStyle.value = {
			position: 'absolute',
			top: `${coords.bottom + 5}px`,
			left: `${coords.left}px`,
		};
	});
	
	return true;
};

const hideSlashMenu = () => {
	showSlashMenu.value = false;
	selectedSlashIndex.value = 0;
	slashQuery.value = '';
	return false;
};

const handleSlashNavigation = (direction: 'up' | 'down') => {
	return () => {
		if (!showSlashMenu.value) return false;
		
		if (direction === 'up') {
			selectedSlashIndex.value = Math.max(0, selectedSlashIndex.value - 1);
		} else {
			selectedSlashIndex.value = Math.min(
				filteredSlashCommands.value.length - 1,
				selectedSlashIndex.value + 1
			);
		}
		
		return true;
	};
};

const handleSlashEnter = () => {
	if (!showSlashMenu.value) return false;
	
	const command = filteredSlashCommands.value[selectedSlashIndex.value];
	if (command) {
		executeSlashCommand(command);
	}
	
	return true;
};

const executeSlashCommand = (command: any) => {
	command.action();
	hideSlashMenu();
};

// Watch for prop changes
watch(() => props.value, (newValue) => {
	if (!editorView || !newValue) return;
	
	const currentContent = serializeContent(editorView.state.doc);
	if (currentContent !== newValue) {
		const doc = parseContent(newValue);
		const state = EditorState.create({
			doc,
			plugins: editorView.state.plugins,
		});
		editorView.updateState(state);
	}
});

// Lifecycle
onMounted(() => {
	initializeEditor();
});

onUnmounted(() => {
	if (editorView) {
		editorView.destroy();
		editorView = null;
	}
});
</script>

<style scoped>
.block-editor {
	position: relative;
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background: var(--theme--background);
	min-height: 200px;
}

.editor-toolbar {
	display: flex;
	gap: 4px;
	padding: 8px;
	border-bottom: 1px solid var(--theme--border-color);
	background: var(--theme--background-subdued);
}

.toolbar-button {
	padding: 6px 10px;
	border: 1px solid var(--theme--border-color);
	border-radius: 4px;
	background: var(--theme--background);
	color: var(--theme--foreground);
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s;
}

.toolbar-button:hover {
	background: var(--theme--background-accent);
}

.toolbar-button.active {
	background: var(--theme--primary);
	color: var(--theme--primary-foreground);
	border-color: var(--theme--primary);
}

.editor-container {
	min-height: 200px;
}

.editor-container.with-toolbar {
	min-height: 150px;
}

:deep(.editor-content) {
	padding: 16px;
	outline: none;
	min-height: 150px;
}

:deep(.editor-content p) {
	margin: 8px 0;
}

:deep(.editor-content h1) {
	font-size: 2em;
	font-weight: 600;
	margin: 16px 0 8px 0;
}

:deep(.editor-content h2) {
	font-size: 1.5em;
	font-weight: 600;
	margin: 14px 0 6px 0;
}

:deep(.editor-content h3) {
	font-size: 1.25em;
	font-weight: 600;
	margin: 12px 0 4px 0;
}

:deep(.editor-content blockquote) {
	border-left: 4px solid var(--theme--primary);
	margin: 16px 0;
	padding-left: 16px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

:deep(.editor-content ul),
:deep(.editor-content ol) {
	margin: 12px 0;
	padding-left: 24px;
}

:deep(.editor-content li) {
	margin: 4px 0;
}

:deep(.editor-content strong) {
	font-weight: 600;
}

:deep(.editor-content em) {
	font-style: italic;
}

/* Placeholder */
:deep(.editor-content:empty::before) {
	content: attr(data-placeholder);
	color: var(--theme--foreground-subdued);
	pointer-events: none;
	position: absolute;
}

/* Slash menu */
.slash-menu {
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	max-height: 300px;
	overflow-y: auto;
	z-index: 1000;
	min-width: 250px;
}

.slash-command {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	cursor: pointer;
	transition: background-color 0.2s;
}

.slash-command:hover,
.slash-command.selected {
	background: var(--theme--background-accent);
}

.command-icon {
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--theme--background-subdued);
	border-radius: 4px;
	font-weight: 600;
	font-size: 12px;
}

.command-name {
	font-weight: 500;
	color: var(--theme--foreground);
}

.command-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}
</style> 