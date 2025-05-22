<!-- eslint-disable vue/prop-name-casing -->
<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '@directus/extensions-sdk';

const props = withDefaults(defineProps<{
	file_field?: string;
	target_field?: string;
	button_label?: string;
}>(), {
	button_label: 'Convert PDF to HTML',
});

const { t } = useI18n();
const api = useApi();

// Get form values to update the target field
const values = inject('values', ref<Record<string, any>>({}));

const isLoading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const { fileID, fileIsValid } = useSelectedFile();

function useSelectedFile() {
	const fieldValues = inject('values', ref<Record<string, any>>({}));

	const fileID = computed(() => {
		if (!props.file_field)
			return null;
		return fieldValues.value[props.file_field] ?? null;
	});

	const fileIsValid = computed(() => !!fileID.value);

	return { fileID, fileIsValid };
}

async function convertPdfToHtml() {
	if (!fileID.value) return;
	
	isLoading.value = true;
	error.value = null;
	success.value = false;
	
	try {
		// Call the PDF extraction endpoint
		const response = await api.get(`/llama-pdf-extract/${fileID.value}`);
		
		if (response.data?.data?.html) {
			// If target field is specified, update it with the HTML
			if (props.target_field && values.value) {
				values.value[props.target_field] = response.data.data.html;
			}
			
			// Optional: copy to clipboard
			try {
				await navigator.clipboard.writeText(response.data.data.html);
				success.value = true;
			} catch (clipboardErr) {
				console.warn('Could not copy to clipboard:', clipboardErr);
				// Still mark as success if we updated the field
				success.value = !!props.target_field;
			}
		} else {
			throw new Error('No HTML content received from conversion service');
		}
	} catch (err: any) {
		console.error('Error converting PDF:', err);
		error.value = err.message || 'Failed to convert PDF';
	} finally {
		isLoading.value = false;
		
		// Auto-hide success message after 3 seconds
		if (success.value) {
			setTimeout(() => {
				success.value = false;
			}, 3000);
		}
	}
}
</script>

<template>
	<div class="pdf-to-html-interface">
		<v-button 
			:disabled="!fileIsValid" 
			:loading="isLoading" 
			@click="convertPdfToHtml"
		>
			<v-icon name="transform" left />
			{{ t(button_label) }}
		</v-button>
		
		<v-notice v-if="error" type="danger" class="notice">
			{{ error }}
		</v-notice>
		
		<v-notice v-if="success" type="success" class="notice">
			<template v-if="target_field">
				HTML content has been inserted into {{ target_field }} field
			</template>
			<template v-else>
				HTML content has been copied to clipboard
			</template>
		</v-notice>
	</div>
</template>

<style scoped>
.pdf-to-html-interface {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.notice {
	margin-top: 8px;
}
</style>