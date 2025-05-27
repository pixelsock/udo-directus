<template>
    <ToolButton 
        :title="props.title" 
        :icon="props.icon" 
        :display="props.display"
        :shortcut="props.shortcut"
        :disabled="props.disabled" 
        :active="props.active" 
        :action="openFileDialog" 
    />
    <input
        ref="fileInput"
        type="file"
        accept=".docx"
        style="display: none"
        @change="handleFileSelect"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { type Editor } from '@tiptap/vue-3';
import ToolButton from './ToolButton.vue';
import type { CustomToolButtonProps } from '../types';
import { useApi } from '@directus/extensions-sdk';
import * as mammoth from 'mammoth';

const props = defineProps<CustomToolButtonProps>();

const fileInput = ref<HTMLInputElement | null>(null);
const api = useApi();

const openFileDialog = () => {
    if (fileInput.value) {
        fileInput.value.click();
    }
};

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

// Helper function to upload image to Directus
const uploadImageToDirectus = async (imageBlob: Blob, filename: string): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', imageBlob, filename);
        formData.append('folder', '88f605c8-e61f-4e64-9839-24e42c7bf82d'); // Specific folder for imported images
        
        const response = await api.post('/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        return response.data.data.id;
    } catch (error) {
        console.error('Error uploading image to Directus:', error);
        throw error;
    }
};

// Helper function to insert content with custom images
const insertContentWithCustomImages = async (html: string): Promise<void> => {
    // Parse HTML to extract images
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');
    
    // Convert images to customImage commands
    const imageCommands: Array<{ src: string; alt: string; title: string }> = [];
    
    images.forEach((img) => {
        const src = img.getAttribute('src');
        const alt = img.getAttribute('alt') || '';
        const title = img.getAttribute('title') || '';
        
        if (src) {
            imageCommands.push({ src, alt, title });
            // Remove the img tag from HTML
            img.remove();
        }
    });
    
    // Get the remaining HTML content without images
    const bodyContent = doc.body.innerHTML;
    
    // Insert the HTML content first
    if (bodyContent.trim()) {
        props.editor.chain().focus().insertContent(bodyContent).run();
    }
    
    // Insert each image using the setImage command
    for (const imageData of imageCommands) {
        props.editor.chain().focus().setImage({
            src: imageData.src,
            alt: imageData.alt,
            title: imageData.title
        }).run();
    }
};

// Helper function to process HTML and upload images
const processImagesInHtml = async (html: string): Promise<string> => {
    console.log('🖼️ Original HTML:', html.substring(0, 500) + '...');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');
    
    console.log(`🖼️ Found ${images.length} images to process`);
    
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img) continue;
        
        const src = img.getAttribute('src');
        
        console.log(`🖼️ Processing image ${i + 1}: ${src?.substring(0, 50)}...`);
        
        if (src && src.startsWith('data:')) {
            try {
                // Extract base64 data and mime type
                const matches = src.match(/^data:([^;]+);base64,(.+)$/);
                if (matches && matches[1] && matches[2]) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    
                    // Create blob from base64
                    const imageBlob = base64ToBlob(base64Data, mimeType);
                    
                    // Generate filename based on image index and mime type
                    const extension = mimeType.split('/')[1];
                    const filename = `docx-import-image-${Date.now()}-${i + 1}.${extension}`;
                    
                    // Upload to Directus
                    const fileId = await uploadImageToDirectus(imageBlob, filename);
                    
                    // Replace src with absolute Directus asset URL
                    const assetUrl = `${window.location.origin}/assets/${fileId}`;
                    img.setAttribute('src', assetUrl);
                    
                    // Ensure the image has proper attributes
                    if (!img.getAttribute('alt')) {
                        img.setAttribute('alt', `Imported image ${i + 1}`);
                    }
                    
                    console.log(`✅ Uploaded image ${i + 1} as file ID: ${fileId}, URL: ${assetUrl}`);
                }
            } catch (error) {
                console.error(`❌ Error processing image ${i + 1}:`, error);
                // Keep original base64 if upload fails
            }
        }
    }
    
    // Get the full HTML content, not just body
    const processedHtml = new XMLSerializer().serializeToString(doc);
    const bodyMatch = processedHtml.match(/<body[^>]*>(.*?)<\/body>/s);
    const finalHtml: string = (bodyMatch && bodyMatch[1]) ? bodyMatch[1] : processedHtml;
    
    console.log('🖼️ Processed HTML:', finalHtml.substring(0, 500) + '...');
    console.log(`🖼️ Final image count: ${(finalHtml.match(/<img/g) || []).length}`);
    
    return finalHtml;
};

const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
        // Use mammoth to convert DOCX to HTML
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        let html = result.value;
        // Process images in the HTML and upload them to Directus
        html = await processImagesInHtml(html);
        // Convert images in HTML to customImage nodes and insert content
        await insertContentWithCustomImages(html);
        // Log any conversion warnings
        if (result.messages.length > 0) {
            console.warn('DOCX conversion warnings:', result.messages);
        }
        // Clear the file input for future use
        if (fileInput.value) {
            fileInput.value.value = '';
        }
    } catch (error) {
        console.error('Error importing DOCX file:', error);
    }
};
</script> 