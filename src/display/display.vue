<template>
	<div class="block-display">
		<div v-if="formattedContent" v-html="formattedContent"></div>
		<div v-else class="empty-state">
			<em>No content</em>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	value?: string | null;
	maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
	maxLength: null,
});

// Parse the JSON content from our block editor
const parsedContent = computed(() => {
	if (!props.value) return null;
	
	try {
		const parsed = JSON.parse(props.value);
		if (Array.isArray(parsed)) {
			return parsed;
		}
	} catch {
		// If it's not JSON, treat as plain text
		return [{
			id: '1',
			type: 'paragraph',
			content: props.value
		}];
	}
	
	return null;
});

// Convert blocks to HTML
const formattedContent = computed(() => {
	if (!parsedContent.value) return '';
	
	const convertBlockToHtml = (block: any): string => {
		const content = block.content || '';
		
		switch (block.type) {
			case 'heading1':
				return `<h1>${content}</h1>`;
			case 'heading2':
				return `<h2>${content}</h2>`;
			case 'heading3':
				return `<h3>${content}</h3>`;
			case 'blockquote':
				return `<blockquote>${content}</blockquote>`;
			case 'list-item':
				return `<li>${content}</li>`;
			case 'paragraph':
			default:
				return content ? `<p>${content}</p>` : '';
		}
	};
	
	let html = parsedContent.value.map(convertBlockToHtml).join('');
	
	// Apply max length if specified
	if (props.maxLength && html) {
		const textContent = html.replace(/<[^>]*>/g, '');
		if (textContent.length > props.maxLength) {
			const truncatedText = textContent.substring(0, props.maxLength) + '...';
			html = `<p>${truncatedText}</p>`;
		}
	}
	
	return html;
});
</script>

<style scoped>
.block-display {
	line-height: 1.6;
	color: var(--theme--foreground);
}

.empty-state {
	color: var(--theme--foreground-subdued);
	font-style: italic;
	padding: 8px 0;
}

/* Content styling */
.block-display :deep(h1),
.block-display :deep(h2),
.block-display :deep(h3) {
	margin: 16px 0 8px 0;
	font-weight: 600;
	line-height: 1.3;
}

.block-display :deep(h1) { 
	font-size: 2em; 
}

.block-display :deep(h2) { 
	font-size: 1.5em; 
}

.block-display :deep(h3) { 
	font-size: 1.25em; 
}

.block-display :deep(p) {
	margin: 8px 0;
}

.block-display :deep(blockquote) {
	border-left: 4px solid var(--theme--primary);
	margin: 16px 0;
	padding-left: 16px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}

.block-display :deep(li) {
	margin: 4px 0;
	list-style: disc;
	margin-left: 20px;
}

.block-display :deep(strong) {
	font-weight: 600;
}

.block-display :deep(em) {
	font-style: italic;
}
</style> 