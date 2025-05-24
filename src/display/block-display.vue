<template>
	<div class="block-display" :class="{ 'no-formatting': !showFormatting }">
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
	showFormatting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
	maxLength: null,
	showFormatting: true,
});

// Parse the JSON content from ProseMirror
const parsedContent = computed(() => {
	if (!props.value) return null;
	
	try {
		const parsed = JSON.parse(props.value);
		if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
			return parsed;
		}
	} catch {
		// If it's not JSON, treat as plain text
		return {
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: props.value }]
				}
			]
		};
	}
	
	return null;
});

// Convert ProseMirror document to HTML
const formattedContent = computed(() => {
	if (!parsedContent.value) return '';
	
	const convertNodeToHtml = (node: any): string => {
		if (!node) return '';
		
		// Handle text nodes
		if (node.type === 'text') {
			let text = node.text || '';
			
			// Apply marks (formatting)
			if (node.marks && props.showFormatting) {
				node.marks.forEach((mark: any) => {
					switch (mark.type) {
						case 'strong':
							text = `<strong>${text}</strong>`;
							break;
						case 'em':
							text = `<em>${text}</em>`;
							break;
						case 'code':
							text = `<code>${text}</code>`;
							break;
						case 'link':
							const href = mark.attrs?.href || '#';
							text = `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
							break;
					}
				});
			}
			
			return text;
		}
		
		// Handle content nodes
		let content = '';
		if (node.content && Array.isArray(node.content)) {
			content = node.content.map(convertNodeToHtml).join('');
		}
		
		// Handle different node types
		switch (node.type) {
			case 'doc':
				return content;
				
			case 'paragraph':
				return content ? `<p>${content}</p>` : '<p></p>';
				
			case 'heading':
				const level = node.attrs?.level || 1;
				return `<h${level}>${content}</h${level}>`;
				
			case 'blockquote':
				return `<blockquote>${content}</blockquote>`;
				
			case 'code_block':
				return `<pre><code>${content}</code></pre>`;
				
			case 'bullet_list':
				return `<ul>${content}</ul>`;
				
			case 'ordered_list':
				return `<ol>${content}</ol>`;
				
			case 'list_item':
				return `<li>${content}</li>`;
				
			case 'hard_break':
				return '<br>';
				
			case 'horizontal_rule':
				return '<hr>';
				
			default:
				return content;
		}
	};
	
	let html = convertNodeToHtml(parsedContent.value);
	
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

.block-display.no-formatting {
	font-family: monospace;
}

.empty-state {
	color: var(--theme--foreground-subdued);
	font-style: italic;
	padding: 8px 0;
}

/* Content styling */
.block-display :deep(h1),
.block-display :deep(h2),
.block-display :deep(h3),
.block-display :deep(h4),
.block-display :deep(h5),
.block-display :deep(h6) {
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

.block-display :deep(h4) { 
	font-size: 1.1em; 
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

.block-display :deep(pre) {
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	padding: 12px;
	margin: 12px 0;
	overflow-x: auto;
}

.block-display :deep(code) {
	background: var(--theme--background-subdued);
	padding: 2px 4px;
	border-radius: 3px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.9em;
}

.block-display :deep(pre code) {
	background: none;
	padding: 0;
}

.block-display :deep(ul),
.block-display :deep(ol) {
	margin: 12px 0;
	padding-left: 24px;
}

.block-display :deep(li) {
	margin: 4px 0;
}

.block-display :deep(strong) {
	font-weight: 600;
}

.block-display :deep(em) {
	font-style: italic;
}

.block-display :deep(a) {
	color: var(--theme--primary);
	text-decoration: underline;
}

.block-display :deep(a:hover) {
	color: var(--theme--primary-accent);
}

.block-display :deep(hr) {
	border: none;
	border-top: 1px solid var(--theme--border-color);
	margin: 24px 0;
}

.block-display :deep(br) {
	line-height: 1.6;
}
</style> 