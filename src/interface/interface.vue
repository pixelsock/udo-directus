<template>
	<div class="simple-block-editor">
		<!-- Toolbar -->
		<div v-if="toolbar" class="editor-toolbar">
			<button 
				v-for="tool in toolbarItems" 
				:key="tool.name"
				@click="tool.action"
				class="toolbar-button"
				:title="tool.title"
			>
				{{ tool.name }}
			</button>
		</div>

		<!-- Editor Container -->
		<div class="editor-container">
			<div 
				v-for="(block, index) in blocks" 
				:key="block.id"
				class="block-wrapper"
			>
				<!-- Block Content -->
				<div 
					:contenteditable="!disabled"
					@input="updateBlock(index, $event)"
					@keydown="handleKeydown($event, index)"
					@focus="setActiveBlock(index)"
					:placeholder="placeholder || 'Type / for commands...'"
					class="block-input"
					:class="getBlockClass(block.type)"
					v-html="block.content"
				></div>

				<!-- Block Type Selector -->
				<div v-if="showBlockSelector === index" class="block-type-selector">
					<div 
						v-for="blockType in blockTypes" 
						:key="blockType.type"
						@click="changeBlockType(index, blockType.type)"
						class="block-type-option"
					>
						<span class="block-icon">{{ blockType.icon }}</span>
						<div>
							<div class="block-name">{{ blockType.name }}</div>
							<div class="block-description">{{ blockType.description }}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Add Block Button -->
			<div class="add-block-container">
				<button @click="addBlock" class="add-block-button" :disabled="disabled">
					+ Add Block
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';

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

// Block structure
interface Block {
	id: string;
	type: string;
	content: string;
}

// Reactive state
const blocks = ref<Block[]>([]);
const activeBlockIndex = ref(-1);
const showBlockSelector = ref(-1);

// Block types configuration
const blockTypes = [
	{
		type: 'paragraph',
		name: 'Paragraph',
		description: 'Plain text paragraph',
		icon: 'P',
	},
	{
		type: 'heading1',
		name: 'Heading 1',
		description: 'Large section heading',
		icon: 'H1',
	},
	{
		type: 'heading2',
		name: 'Heading 2',
		description: 'Medium section heading',
		icon: 'H2',
	},
	{
		type: 'heading3',
		name: 'Heading 3',
		description: 'Small section heading',
		icon: 'H3',
	},
	{
		type: 'blockquote',
		name: 'Quote',
		description: 'Quote or citation',
		icon: '"',
	},
];

// Toolbar configuration
const toolbarItems = [
	{
		name: 'B',
		title: 'Bold',
		action: () => formatText('bold'),
	},
	{
		name: 'I',
		title: 'Italic',
		action: () => formatText('italic'),
	},
	{
		name: 'H1',
		title: 'Heading 1',
		action: () => changeActiveBlockType('heading1'),
	},
	{
		name: 'H2',
		title: 'Heading 2',
		action: () => changeActiveBlockType('heading2'),
	},
	{
		name: 'H3',
		title: 'Heading 3',
		action: () => changeActiveBlockType('heading3'),
	},
	{
		name: '"',
		title: 'Quote',
		action: () => changeActiveBlockType('blockquote'),
	},
];

// Initialize blocks from value
const initializeBlocks = () => {
	if (!props.value) {
		blocks.value = [createNewBlock()];
		return;
	}

	try {
		const parsed = JSON.parse(props.value);
		if (Array.isArray(parsed) && parsed.length > 0) {
			blocks.value = parsed.map(block => ({
				id: block.id || generateId(),
				type: block.type || 'paragraph',
				content: block.content || '',
			}));
		} else {
			blocks.value = [createNewBlock()];
		}
	} catch {
		// If not JSON, create a single paragraph with the content
		blocks.value = [{
			id: generateId(),
			type: 'paragraph',
			content: props.value,
		}];
	}
};

// Create new block
const createNewBlock = (type = 'paragraph', content = ''): Block => ({
	id: generateId(),
	type,
	content,
});

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Block management
const addBlock = (index?: number, type = 'paragraph') => {
	const newBlock = createNewBlock(type);
	const insertIndex = index !== undefined ? index + 1 : blocks.value.length;
	blocks.value.splice(insertIndex, 0, newBlock);
	emitChange();
};

const changeBlockType = (index: number, type: string) => {
	blocks.value[index].type = type;
	showBlockSelector.value = -1;
	emitChange();
};

const changeActiveBlockType = (type: string) => {
	if (activeBlockIndex.value >= 0) {
		changeBlockType(activeBlockIndex.value, type);
	}
};

// Block interaction
const setActiveBlock = (index: number) => {
	activeBlockIndex.value = index;
	showBlockSelector.value = -1;
};

const updateBlock = (index: number, event: Event) => {
	const target = event.target as HTMLElement;
	blocks.value[index].content = target.innerHTML || '';
	emitChange();
};

const getBlockClass = (type: string) => {
	switch (type) {
		case 'heading1':
			return 'heading-1';
		case 'heading2':
			return 'heading-2';
		case 'heading3':
			return 'heading-3';
		case 'blockquote':
			return 'quote-block';
		default:
			return 'paragraph-block';
	}
};

// Text formatting
const formatText = (command: string) => {
	document.execCommand(command, false);
};

// Keyboard handling
const handleKeydown = (event: KeyboardEvent, index: number) => {
	const target = event.target as HTMLElement;
	
	// Handle slash commands
	if (event.key === '/' && props.slashCommands && target.textContent === '') {
		event.preventDefault();
		showBlockSelector.value = index;
		return;
	}
	
	// Hide block selector on escape
	if (event.key === 'Escape') {
		showBlockSelector.value = -1;
		return;
	}
	
	// Handle enter key
	if (event.key === 'Enter' && !event.shiftKey) {
		if (showBlockSelector.value >= 0) {
			showBlockSelector.value = -1;
			event.preventDefault();
			return;
		}
		
		// Create new block on enter
		event.preventDefault();
		addBlock(index);
		
		// Focus next block
		nextTick(() => {
			const nextIndex = index + 1;
			if (nextIndex < blocks.value.length) {
				const nextBlock = document.querySelectorAll('.block-input')[nextIndex] as HTMLElement;
				if (nextBlock) {
					nextBlock.focus();
				}
			}
		});
	}
};

// Emit changes
const emitChange = () => {
	const value = JSON.stringify(blocks.value);
	emit('input', value);
};

// Watch for external value changes
watch(() => props.value, (newValue) => {
	if (newValue !== JSON.stringify(blocks.value)) {
		initializeBlocks();
	}
});

// Initialize on mount
onMounted(() => {
	initializeBlocks();
});
</script>

<style scoped>
.simple-block-editor {
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

.editor-container {
	padding: 16px;
	min-height: 150px;
}

.block-wrapper {
	position: relative;
	margin: 8px 0;
}

.block-input {
	width: 100%;
	border: none;
	outline: none;
	background: transparent;
	color: var(--theme--foreground);
	font-family: inherit;
	line-height: 1.6;
	min-height: 1.5em;
	padding: 4px;
	border-radius: 4px;
	transition: background-color 0.2s;
}

.block-input:hover {
	background: var(--theme--background-subdued);
}

.block-input:focus {
	background: var(--theme--background-accent);
}

.block-input:empty::before {
	content: attr(placeholder);
	color: var(--theme--foreground-subdued);
	pointer-events: none;
}

.heading-1 {
	font-size: 2em;
	font-weight: 600;
	margin: 16px 0 8px 0;
}

.heading-2 {
	font-size: 1.5em;
	font-weight: 600;
	margin: 14px 0 6px 0;
}

.heading-3 {
	font-size: 1.25em;
	font-weight: 600;
	margin: 12px 0 4px 0;
}

.paragraph-block {
	margin: 8px 0;
}

.quote-block {
	border-left: 4px solid var(--theme--primary);
	padding-left: 16px;
	margin: 16px 0;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.block-type-selector {
	position: absolute;
	top: 100%;
	left: 0;
	background: var(--theme--background);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	z-index: 1000;
	min-width: 250px;
	max-height: 300px;
	overflow-y: auto;
}

.block-type-option {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	cursor: pointer;
	transition: background-color 0.2s;
}

.block-type-option:hover {
	background: var(--theme--background-accent);
}

.block-icon {
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

.block-name {
	font-weight: 500;
	color: var(--theme--foreground);
}

.block-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

.add-block-container {
	margin-top: 16px;
	text-align: center;
}

.add-block-button {
	padding: 8px 16px;
	border: 1px dashed var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background: transparent;
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	transition: all 0.2s;
}

.add-block-button:hover:not(:disabled) {
	border-color: var(--theme--primary);
	color: var(--theme--primary);
}

.add-block-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
</style> 