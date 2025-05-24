<template>
    <div 
        v-if="showMenu" 
        class="image-bubble-menu"
        :style="menuPosition"
    >
        <div class="bubble-menu-section">
            <label>Size:</label>
            <v-select
                v-model="currentSize"
                :items="sizeOptions"
                :small="true"
                @update:model-value="updateImageSize"
            />
        </div>
        
        <v-divider />
        
        <div class="bubble-menu-section">
            <label>Alignment:</label>
            <v-select
                v-model="currentAlignment"
                :items="alignmentOptions"
                :small="true"
                @update:model-value="updateImageAlignment"
            />
        </div>
        
        <v-divider />
        
        <div class="bubble-menu-section">
            <label>Caption:</label>
            <v-input
                v-model="currentCaption"
                placeholder="Add caption..."
                :small="true"
                @update:model-value="updateImageCaption"
            />
        </div>
        
        <v-divider />
        
        <div class="bubble-menu-section">
            <label>Alt Text:</label>
            <v-input
                v-model="currentAlt"
                placeholder="Alt text for accessibility..."
                :small="true"
                @update:model-value="updateImageAlt"
            />
        </div>
        
        <v-divider />
        
        <div class="bubble-menu-section bubble-menu-actions">
            <v-button
                :small="true"
                icon="delete"
                @click="removeImage"
                kind="danger"
                outlined
            >
                Remove
            </v-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
    editor: any;
}>();

const currentSize = ref('medium');
const currentAlignment = ref('left');
const currentCaption = ref('');
const currentAlt = ref('');
const showMenu = ref(false);
const menuPosition = ref({});

const sizeOptions = [
    { text: 'Small (25%)', value: 'small' },
    { text: 'Medium (50%)', value: 'medium' },
    { text: 'Large (75%)', value: 'large' },
    { text: 'Full Width (100%)', value: 'full' },
    { text: 'Original Size', value: 'original' },
];

const alignmentOptions = [
    { text: 'Left', value: 'left' },
    { text: 'Center', value: 'center' },
    { text: 'Right', value: 'right' },
];

let selectionChangeListener: (() => void) | null = null;

// Monitor editor state for image selection
const checkImageSelection = () => {
    if (!props.editor) return;
    
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        const isImageSelected = tiptapEditor.isActive('image');
        showMenu.value = isImageSelected;
        
        if (isImageSelected) {
            updateMenuPosition();
            loadCurrentImageAttributes(tiptapEditor);
        }
    } catch (error) {
        console.warn('Error checking image selection:', error);
    }
};

const updateMenuPosition = () => {
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        const { view } = tiptapEditor;
        const { from } = view.state.selection;
        const start = view.coordsAtPos(from);
        
        menuPosition.value = {
            position: 'absolute',
            top: `${start.top - 60}px`,
            left: `${start.left}px`,
            zIndex: 1000,
        };
    } catch (error) {
        console.warn('Error updating menu position:', error);
        // Fallback positioning
        menuPosition.value = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
        };
    }
};

const loadCurrentImageAttributes = (tiptapEditor: any) => {
    try {
        const { node } = tiptapEditor.state.selection as any;
        if (node && node.type.name === 'image') {
            const attrs = node.attrs;
            
            // Extract current values from the image
            currentAlt.value = attrs.alt || '';
            currentCaption.value = attrs['data-caption'] || '';
            
            // Extract size from style or class
            const style = attrs.style || '';
            if (style.includes('width: 25%')) currentSize.value = 'small';
            else if (style.includes('width: 50%')) currentSize.value = 'medium';
            else if (style.includes('width: 75%')) currentSize.value = 'large';
            else if (style.includes('width: 100%')) currentSize.value = 'full';
            else currentSize.value = 'original';
            
            // Extract alignment from class or style
            const className = attrs.class || '';
            if (className.includes('image-center')) currentAlignment.value = 'center';
            else if (className.includes('image-right')) currentAlignment.value = 'right';
            else currentAlignment.value = 'left';
        }
    } catch (error) {
        console.warn('Error loading image attributes:', error);
    }
};

const getSizeStyles = (size: string): string => {
    switch (size) {
        case 'small': return 'width: 25%; max-width: 200px;';
        case 'medium': return 'width: 50%; max-width: 400px;';
        case 'large': return 'width: 75%; max-width: 600px;';
        case 'full': return 'width: 100%;';
        case 'original': return '';
        default: return 'width: 50%; max-width: 400px;';
    }
};

const getAlignmentClass = (alignment: string): string => {
    switch (alignment) {
        case 'center': return 'umo-image-center';
        case 'right': return 'umo-image-right';
        case 'left':
        default: return 'umo-image-left';
    }
};

const updateImageSize = (size: string) => {
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        const sizeStyles = getSizeStyles(size);
        const alignmentClass = getAlignmentClass(currentAlignment.value);
        
        tiptapEditor.chain().focus().updateAttributes('image', {
            style: sizeStyles,
            class: `umo-editor-image ${alignmentClass}`,
        }).run();
    } catch (error) {
        console.warn('Error updating image size:', error);
    }
};

const updateImageAlignment = (alignment: string) => {
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        const alignmentClass = getAlignmentClass(alignment);
        const sizeStyles = getSizeStyles(currentSize.value);
        
        tiptapEditor.chain().focus().updateAttributes('image', {
            style: sizeStyles,
            class: `umo-editor-image ${alignmentClass}`,
        }).run();
    } catch (error) {
        console.warn('Error updating image alignment:', error);
    }
};

const updateImageCaption = (caption: string) => {
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        // Store caption in a data attribute
        tiptapEditor.chain().focus().updateAttributes('image', {
            'data-caption': caption,
        }).run();
    } catch (error) {
        console.warn('Error updating image caption:', error);
    }
};

const updateImageAlt = (alt: string) => {
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        tiptapEditor.chain().focus().updateAttributes('image', {
            alt: alt,
        }).run();
    } catch (error) {
        console.warn('Error updating image alt:', error);
    }
};

const removeImage = () => {
    try {
        const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
        if (!tiptapEditor) return;
        
        tiptapEditor.chain().focus().deleteSelection().run();
        showMenu.value = false;
    } catch (error) {
        console.warn('Error removing image:', error);
    }
};

// Set up event listeners
onMounted(() => {
    // Check selection immediately
    setTimeout(checkImageSelection, 100);
    
    // Set up continuous checking
    selectionChangeListener = () => {
        checkImageSelection();
    };
    
    // Add listeners for selection changes
    document.addEventListener('selectionchange', selectionChangeListener);
    document.addEventListener('click', selectionChangeListener);
});

onUnmounted(() => {
    if (selectionChangeListener) {
        document.removeEventListener('selectionchange', selectionChangeListener);
        document.removeEventListener('click', selectionChangeListener);
    }
});

// Watch for editor changes
watch(() => props.editor, () => {
    setTimeout(checkImageSelection, 100);
}, { immediate: true });
</script>

<style scoped>
.image-bubble-menu {
    background: var(--theme--background);
    border: 1px solid var(--theme--border-color);
    border-radius: var(--theme--border-radius);
    padding: 12px;
    min-width: 280px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
}

.bubble-menu-section {
    margin-bottom: 8px;
}

.bubble-menu-section:last-child {
    margin-bottom: 0;
}

.bubble-menu-section label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--theme--foreground-subdued);
}

.bubble-menu-section .v-input,
.bubble-menu-section .v-select {
    width: 100%;
}

.bubble-menu-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.bubble-menu-actions .v-button {
    flex: 0 0 auto;
}
</style>

<style>
/* Global styles for UmoEditor images */
.umo-editor-image {
    max-width: 100%;
    height: auto;
    border-radius: var(--theme--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease;
}

.umo-editor-image:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.umo-image-wrapper {
    margin: 1rem 0;
    display: block;
}

.umo-image-wrapper.umo-image-center {
    text-align: center;
}

.umo-image-wrapper.umo-image-right {
    text-align: right;
}

.umo-image-wrapper.umo-image-left {
    text-align: left;
}

.umo-image-caption {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    font-style: italic;
    color: var(--theme--foreground-subdued);
    text-align: inherit;
}
</style> 