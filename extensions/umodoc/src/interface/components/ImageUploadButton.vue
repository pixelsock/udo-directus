<template>
    <v-button
        :title="title"
        :icon="icon"
        :disabled="disabled"
        @click="openFileSelector"
        v-tooltip.top="title"
    >
        <v-icon :name="icon" />
    </v-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';

const props = defineProps<{
    editor: any;
    title?: string;
    icon?: string;
    disabled?: boolean;
}>();

const api = useApi();

const title = props.title || 'Insert Image';
const icon = props.icon || 'image';
const disabled = props.disabled || false;

const openFileSelector = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;
        
        try {
            // Upload to Directus
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await api.post('/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const fileId = response.data.data.id;
            const assetUrl = `${window.location.origin}/assets/${fileId}`;
            
            // Get the TipTap editor instance and insert image
            const tiptapEditor = props.editor.getEditor?.() || props.editor.useEditor?.();
            if (tiptapEditor) {
                tiptapEditor.chain().focus().setImage({ 
                    src: assetUrl,
                    alt: file.name,
                    class: 'umo-editor-image umo-image-left',
                    style: 'width: 50%; max-width: 400px;'
                }).run();
            }
            
        } catch (error) {
            console.error('Error uploading image:', error);
            // TODO: Show user-friendly error message
        }
        
        // Clean up
        document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
};
</script>

<style scoped>
/* Button styles inherit from Directus theme */
</style> 