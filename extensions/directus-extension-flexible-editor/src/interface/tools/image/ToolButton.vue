<template>
  <v-menu
    show-arrow
    placement="bottom-start"
  >
    <template #activator="{ toggle }">
      <ToolButton
        :title="title"
        :icon="icon"
        :active="active"
        :disabled="disabled"
        :action="toggle"
      />
    </template>
    <v-list>
      <v-list-item
        clickable
        @click="action"
        :disabled="imageSelected"
      >
        <v-list-item-content>
          <v-text-overflow :text="t('image.insert')" />
        </v-list-item-content>
      </v-list-item>

      <v-list-group
        :disabled="!imageSelected"
      >
        <template #activator>
          <v-text-overflow :text="t('image.section_size')" />
        </template>

        <v-list-item
          v-for="size in sizeOptions"
          :key="size.value"
          clickable
          @click="updateImageSize(size.value)"
          :active="currentSize === size.value"
          :disabled="!imageSelected"
        >
          <v-list-item-content>
            <v-text-overflow :text="size.label" />
          </v-list-item-content>
        </v-list-item>
      </v-list-group>

      <v-list-group
        :disabled="!imageSelected"
      >
        <template #activator>
          <v-text-overflow :text="t('image.section_alignment')" />
        </template>

        <v-list-item
          v-for="alignment in alignmentOptions"
          :key="alignment.value"
          clickable
          @click="updateImageAlignment(alignment.value)"
          :active="currentAlignment === alignment.value"
          :disabled="!imageSelected"
        >
          <v-list-item-icon>
            <v-icon :name="alignment.icon" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-text-overflow :text="alignment.label" />
          </v-list-item-content>
        </v-list-item>
      </v-list-group>

      <v-list-item
        clickable
        @click="removeImage"
        :disabled="!imageSelected"
      >
        <v-list-item-icon>
          <v-icon name="delete" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-text-overflow :text="t('remove')" />
        </v-list-item-content>
      </v-list-item>

      <v-divider />

      <v-list-item
        clickable
        @click="toggleCaption"
        :disabled="!imageSelected"
      >
        <v-list-item-icon>
          <v-icon :name="imageHasCaption ? 'remove_comment' : 'add_comment'" />
        </v-list-item-icon>
        <v-list-item-content>
          <v-text-overflow :text="imageHasCaption ? t('image.remove_caption') : t('image.add_caption')" />
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from "vue-i18n";
import { useI18nFallback } from "../../composables/use-i18n-fallback";
import ToolButton from "../../components/ToolButton.vue";
import type { CustomToolButtonProps } from "../../types";

const props = defineProps<CustomToolButtonProps>();

const { t } = useI18nFallback(useI18n());

// File input for image uploads
let fileInput: HTMLInputElement | null = null;

function createImageUploader() {
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;
      
      try {
        // Upload to Directus
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/files', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const result = await response.json();
        const imageUrl = `/assets/${result.data.id}`;
        
        // Insert image into editor with default styling
        props.editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: file.name,
          title: file.name
        }).run();
        
        // Apply default size and alignment after insertion
        setTimeout(() => {
          updateImageSize('medium');
        }, 100);
        
        // Reset file input
        target.value = '';
        
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    };
    
    document.body.appendChild(fileInput);
  }
  
  fileInput.click();
}

const sizeOptions = [
  { value: 'small', label: t('image.size_small'), width: '35%' },
  { value: 'medium', label: t('image.size_medium'), width: '50%' },
  { value: 'large', label: t('image.size_large'), width: '75%' },
  { value: 'fullWidth', label: t('image.size_full'), width: '100%' }
];

const alignmentOptions = [
  { value: 'left', label: t('image.align_left'), icon: 'format_align_left' },
  { value: 'center', label: t('image.align_center'), icon: 'format_align_center' },
  { value: 'right', label: t('image.align_right'), icon: 'format_align_right' }
];

const currentImageAttrs = computed(() => {
  if (props.editor.isActive('figure')) {
    return props.editor.getAttributes('figure');
  } else if (props.editor.isActive('image')) {
    return props.editor.getAttributes('image');
  }
  return {};
});

// Check if image or figure is actually selected (regardless of focus)
const imageSelected = computed(() => {
  return props.editor.isActive('image') || props.editor.isActive('figure');
});

// Check if we're in a figure (which has caption)
const imageHasCaption = computed(() => {
  return props.editor.isActive('figure');
});

// Debug logging
const debugInfo = computed(() => {
  const availableCommands = Object.keys(props.editor.commands);
  
  const info = {
    active: props.active,
    editorFocused: props.editor.isFocused,
    isImageActive: props.editor.isActive('image'),
    imageAttrs: props.editor.getAttributes('image'),
    imageHasCaption: imageHasCaption.value,
    style: props.editor.getAttributes('image').style || 'no style',
    combinedActive: props.editor.isFocused && props.editor.isActive('image'),
    availableCommands: availableCommands.filter(cmd => cmd.includes('caption') || cmd.includes('image')),
  };
  console.log('Image tool debug:', info);
  return info;
});

// Parse current size from style attribute
const currentSize = computed(() => {
  const style = currentImageAttrs.value.style || '';
  if (style.includes('width: 35%')) return 'small';
  if (style.includes('width: 50%')) return 'medium';
  if (style.includes('width: 75%')) return 'large';
  if (style.includes('width: 100%')) return 'fullWidth';
  return 'medium';
});

// Parse current alignment from style attribute
const currentAlignment = computed(() => {
  const style = currentImageAttrs.value.style || '';
  if (style.includes('margin-left: auto; margin-right: auto')) return 'center';
  if (style.includes('margin-left: auto; margin-right: 0')) return 'right';
  return 'left';
});

function updateImageSize(size: string) {
  console.log('updateImageSize called with:', size);
  const sizeOption = sizeOptions.find(s => s.value === size);
  if (!sizeOption) {
    console.log('Size option not found:', size);
    return;
  }
  
  const alignment = currentAlignment.value;
  const style = `width: ${sizeOption.width}; ${getAlignmentStyle(alignment)}`;
  
  console.log('Updating image/figure with style:', style);
  
  if (props.editor.isActive('figure')) {
    props.editor.chain().focus().updateAttributes('figure', { style: style }).run();
  } else if (props.editor.isActive('image')) {
    props.editor.chain().focus().updateAttributes('image', { style: style }).run();
  }
}

function updateImageAlignment(alignment: string) {
  console.log('updateImageAlignment called with:', alignment);
  const currentSizeOption = sizeOptions.find(s => s.value === currentSize.value);
  const width = currentSizeOption?.width || '50%';
  
  const style = `width: ${width}; ${getAlignmentStyle(alignment)}`;
  
  console.log('Updating image/figure alignment with style:', style);
  
  if (props.editor.isActive('figure')) {
    props.editor.chain().focus().updateAttributes('figure', { style: style }).run();
  } else if (props.editor.isActive('image')) {
    props.editor.chain().focus().updateAttributes('image', { style: style }).run();
  }
}

function getAlignmentStyle(alignment: string): string {
  switch (alignment) {
    case 'center':
      return 'margin-left: auto; margin-right: auto; display: block;';
    case 'right':
      return 'margin-left: auto; margin-right: 0; display: block;';
    case 'left':
    default:
      return 'margin-left: 0; margin-right: auto; display: block;';
  }
}

function removeImage() {
  props.editor.chain().focus().deleteSelection().run();
}

function toggleCaption() {
  console.log('Toggling caption');
  
  if (props.editor.isActive('figure')) {
    // Convert figure to image
    console.log('Converting figure to image');
    props.editor.chain().focus().figureToImage().run();
  } else if (props.editor.isActive('image')) {
    // Convert image to figure
    console.log('Converting image to figure');
    props.editor.chain().focus().imageToFigure().run();
  }
}

const action = createImageUploader;
</script> 