<template>
    <div class="umo-editor-display">
        <div v-if="format === 'html'" v-html="htmlContent" class="html-content"></div>
        <div v-else-if="format === 'text'" class="text-content">{{ textContent }}</div>
        <pre v-else-if="format === 'json'" class="json-content">{{ jsonContent }}</pre>
        <div v-else class="html-content" v-html="htmlContent"></div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
interface Props {
    value: any;
    format?: 'html' | 'text' | 'json';
    maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
    value: null,
    format: 'html',
    maxLength: undefined,
});

// Helper function to convert Tiptap JSON to HTML
const convertToHtml = (content: any): string => {
    if (!content) return '';
    
    if (typeof content === 'string') {
        return content;
    }
    
    // Basic conversion for common Tiptap node types
    if (content.type === 'doc' && content.content) {
        return content.content.map((node: any) => convertNodeToHtml(node)).join('');
    }
    
    return convertNodeToHtml(content);
};

const convertNodeToHtml = (node: any): string => {
    if (!node) return '';
    
    switch (node.type) {
        case 'paragraph':
            const paragraphContent = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            return `<p>${paragraphContent}</p>`;
        
        case 'heading':
            const level = node.attrs?.level || 1;
            const headingContent = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            return `<h${level}>${headingContent}</h${level}>`;
        
        case 'text':
            let text = node.text || '';
            
            // Apply marks (formatting)
            if (node.marks) {
                node.marks.forEach((mark: any) => {
                    switch (mark.type) {
                        case 'bold':
                            text = `<strong>${text}</strong>`;
                            break;
                        case 'italic':
                            text = `<em>${text}</em>`;
                            break;
                        case 'underline':
                            text = `<u>${text}</u>`;
                            break;
                        case 'strike':
                            text = `<s>${text}</s>`;
                            break;
                        case 'code':
                            text = `<code>${text}</code>`;
                            break;
                        case 'link':
                            const href = mark.attrs?.href || '#';
                            text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                            break;
                    }
                });
            }
            
            return text;
        
        case 'bulletList':
            const bulletItems = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            return `<ul>${bulletItems}</ul>`;
        
        case 'orderedList':
            const orderedItems = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            return `<ol>${orderedItems}</ol>`;
        
        case 'listItem':
            const listContent = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            return `<li>${listContent}</li>`;
        
        case 'blockquote':
            const quoteContent = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            return `<blockquote>${quoteContent}</blockquote>`;
        
        case 'codeBlock':
            const codeContent = node.content ? node.content.map((child: any) => convertNodeToHtml(child)).join('') : '';
            const language = node.attrs?.language || '';
            return `<pre><code class="language-${language}">${codeContent}</code></pre>`;
        
        case 'hardBreak':
            return '<br>';
        
        case 'horizontalRule':
            return '<hr>';
        
        default:
            // For unknown node types, try to render content if available
            if (node.content) {
                return node.content.map((child: any) => convertNodeToHtml(child)).join('');
            }
            return '';
    }
};

// Helper function to convert to plain text
const convertToText = (content: any): string => {
    if (!content) return '';
    
    if (typeof content === 'string') {
        return content;
    }
    
    const extractText = (node: any): string => {
        if (!node) return '';
        
        if (node.type === 'text') {
            return node.text || '';
        }
        
        if (node.content) {
            return node.content.map((child: any) => extractText(child)).join('');
        }
        
        return '';
    };
    
    return extractText(content);
};

// Helper function to truncate text
const truncateText = (text: string, maxLength?: number): string => {
    if (!maxLength || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
};

// Computed properties
const htmlContent = computed(() => {
    const html = convertToHtml(props.value);
    return props.maxLength ? truncateText(html, props.maxLength) : html;
});

const textContent = computed(() => {
    const text = convertToText(props.value);
    return props.maxLength ? truncateText(text, props.maxLength) : text;
});

const jsonContent = computed(() => {
    const json = JSON.stringify(props.value, null, 2);
    return props.maxLength ? truncateText(json, props.maxLength) : json;
});
</script>

<style scoped>
.umo-editor-display {
    word-wrap: break-word;
    word-break: break-word;
}

.html-content {
    line-height: 1.5;
}

.html-content :deep(p) {
    margin: 0 0 0.5em 0;
}

.html-content :deep(p:last-child) {
    margin-bottom: 0;
}

.html-content :deep(h1, h2, h3, h4, h5, h6) {
    margin: 0 0 0.5em 0;
    font-weight: 600;
}

.html-content :deep(ul, ol) {
    margin: 0 0 0.5em 0;
    padding-left: 1.5em;
}

.html-content :deep(blockquote) {
    margin: 0 0 0.5em 0;
    padding-left: 1em;
    border-left: 3px solid var(--theme--border-color);
    color: var(--theme--foreground-subdued);
}

.html-content :deep(code) {
    background-color: var(--theme--background-accent);
    padding: 0.125em 0.25em;
    border-radius: 0.25em;
    font-family: var(--theme--font-family-monospace);
    font-size: 0.875em;
}

.html-content :deep(pre) {
    background-color: var(--theme--background-accent);
    padding: 1em;
    border-radius: 0.5em;
    overflow-x: auto;
    margin: 0 0 0.5em 0;
}

.html-content :deep(pre code) {
    background: none;
    padding: 0;
}

.html-content :deep(a) {
    color: var(--theme--primary);
    text-decoration: underline;
}

.text-content {
    white-space: pre-wrap;
    line-height: 1.5;
}

.json-content {
    background-color: var(--theme--background-accent);
    padding: 1em;
    border-radius: 0.5em;
    font-family: var(--theme--font-family-monospace);
    font-size: 0.875em;
    overflow-x: auto;
    white-space: pre;
}
</style> 