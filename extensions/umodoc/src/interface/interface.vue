<template>
    <div class="umo-editor-interface">
        <div v-if="!disabled" class="umo-editor-wrapper">
            <umo-editor
                ref="editorRef"
                v-bind="editorOptions"
            />
            <!-- Image Bubble Menu -->
            <ImageBubbleMenu
                v-if="editorRef"
                :editor="editorRef"
            />
            <!-- Floating Image Upload Button -->
            <div class="floating-tools">
                <ImageUploadButton
                    v-if="editorRef"
                    :editor="editorRef"
                    title="Insert Image"
                    icon="image"
                    :disabled="props.disabled || props.readonly"
                />
            </div>
        </div>
        <div v-else class="umo-editor-readonly" v-html="displayContent"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import UmoEditor from '@umoteam/editor';
import '@umoteam/editor/style';
import ImageBubbleMenu from './components/ImageBubbleMenu.vue';
import ImageUploadButton from './components/ImageUploadButton.vue';

// Props
interface Props {
    value: any;
    disabled: boolean;
    placeholder?: string;
    readonly?: boolean;
    settings?: any;
    field?: string;
    collection?: string;
    primaryKey?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
    value: null,
    disabled: false,
    placeholder: 'Enter your content...',
    readonly: false,
    settings: () => ({}),
});

// Emits
const emit = defineEmits<{
    input: [value: any];
}>();

// Refs
const editorRef = ref<any>(null);

// Computed properties
const editorOptions = computed(() => {
    const defaultOptions = {
        editorKey: `directus-${props.field}-${props.primaryKey}` || 'default',
        locale: "zh-CN",
        theme: "light",
        height: "400px",
        document: {
            content: props.value || "",
            placeholder: props.placeholder || 'Please enter the document content...',
            readOnly: props.disabled || props.readonly
        }
    };

    // Merge user settings with defaults  
    const mergedOptions = { ...defaultOptions, ...props.settings };
    
    // Always override content and readOnly from props
    if (mergedOptions.document) {
        mergedOptions.document.content = props.value || "";
        mergedOptions.document.readOnly = props.disabled || props.readonly;
    }

    console.log('🔧 UmoEditor options:', mergedOptions);
    return mergedOptions;
});

const displayContent = computed(() => {
    if (!props.value) return '';
    
    // For readonly display, we'll convert the content to HTML
    if (typeof props.value === 'string') {
        return props.value;
    }
    
    // If it's an object, try to extract text content or render as JSON
    if (typeof props.value === 'object') {
        // Try to extract text content
        if (props.value.type === 'doc' && props.value.content) {
            return extractTextFromContent(props.value.content);
        }
        return JSON.stringify(props.value, null, 2);
    }
    
    return String(props.value);
});

// Helper function to extract text from content
const extractTextFromContent = (content: any[]): string => {
    let text = '';
    content.forEach((node: any) => {
        if (node.type === 'paragraph' && node.content) {
            node.content.forEach((textNode: any) => {
                if (textNode.type === 'text' && textNode.text) {
                    text += textNode.text;
                }
            });
            text += '<br>';
        } else if (node.type === 'text' && node.text) {
            text += node.text;
        }
    });
    return text;
};

// Deep merge utility
const deepMerge = (target: any, source: any): any => {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
};

// Watch for external value changes
watch(
    () => props.value,
    (newValue) => {
        if (!editorRef.value) return;
        
        // Get current editor content
        try {
            const currentOptions = editorRef.value.getOptions();
            const currentContent = currentOptions?.document?.content;
            
            // Only update if content is different
            if (currentContent !== newValue) {
                console.log('🔄 Updating editor content from props');
                // Update the editor content
                // Note: We might need to call a method on the editor to update content
                // This depends on UmoEditor's API - we may need to update the entire options
            }
        } catch (error) {
            console.warn('⚠️ Could not get current editor options:', error);
        }
    }
);

// Lifecycle
onMounted(() => {
    console.log('✅ UmoEditor component mounted');
    console.log('📝 Editor ref:', editorRef.value);
    
    // Set up content change monitoring after mount
    setTimeout(() => {
        if (editorRef.value) {
            try {
                // Try to get the underlying editor instance and set up change monitoring
                const editor = editorRef.value.getEditor?.();
                if (editor) {
                    editor.on('update', ({ editor }: any) => {
                        const content = editor.getJSON();
                        emit('input', content);
                    });
                }
            } catch (error) {
                console.warn('⚠️ Could not set up content monitoring:', error);
            }
        }
    }, 100);
});
</script>

<style scoped>
.umo-editor-interface {
    width: 100%;
}

.umo-editor-wrapper {
    border: 1px solid var(--theme--border-color);
    border-radius: var(--theme--border-radius);
    overflow: hidden;
    min-height: 400px;
}

.umo-editor-readonly {
    padding: 1rem;
    background-color: var(--theme--background-accent);
    border: 1px solid var(--theme--border-color-subdued);
    border-radius: var(--theme--border-radius);
    color: var(--theme--foreground-subdued);
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 200px;
}

/* Focus styles */
.umo-editor-wrapper:focus-within {
    border-color: var(--theme--primary, var(--primary));
    box-shadow: 0 0 0 2px var(--theme--primary-25, rgba(var(--primary-rgb), 0.25));
}

/* Disabled state */
.umo-editor-wrapper:has(.umo-editor[readonly]) {
    background-color: var(--theme--background-subdued, var(--background-subdued));
    color: var(--theme--foreground-subdued, var(--foreground-subdued));
}
</style> 