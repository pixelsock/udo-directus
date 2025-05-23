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

// Check if the selected file is a PDF
const isPdfFile = computed(() => {
	const fieldValues = inject('values', ref<Record<string, any>>({}));
	if (!props.file_field || !fieldValues.value[props.file_field]) return false;
	
	// We can't easily check the file type here without additional API calls
	// So we'll rely on the backend validation
	return true;
});

async function convertPdfToHtml() {
	if (!fileID.value) return;
	
	isLoading.value = true;
	error.value = null;
	success.value = false;
	
	try {
		console.log('Converting PDF with file ID:', fileID.value);
		
		// Try several URL patterns to handle different configurations
		let response;
		try {
			// First try the standard extensions path
			console.log('Trying /extensions/llama-pdf-extract path...');
			response = await api.get(`/extensions/llama-pdf-extract/${fileID.value}`);
		} catch (err: any) {
			if (err.response?.status === 404) {
				// If not found, try without the extensions prefix
				console.log('Trying /llama-pdf-extract path...');
				response = await api.get(`/llama-pdf-extract/${fileID.value}`);
			} else {
				throw err;
			}
		}
		
		console.log('API response:', response);
		
		if (response.data?.data?.html) {
			// If target field is specified, update it with the HTML
			if (props.target_field && values.value) {
				values.value[props.target_field] = response.data.data.html;
				console.log(`Updated field ${props.target_field} with HTML content`);
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
			console.error('Invalid response structure:', response);
			throw new Error('No HTML content received from conversion service');
		}
	} catch (err: any) {
		console.error('Error converting PDF:', err);
		console.error('Error details:', {
			message: err.message,
			status: err.response?.status,
			data: err.response?.data,
			url: `/extensions/llama-pdf-extract/${fileID.value}`
		});
		
		// Use the specific error message from the backend
		if (err.response?.data?.message) {
			error.value = err.response.data.message;
		} else if (err.response?.status === 404) {
			error.value = 'Please add a PDF file';
		} else if (err.response?.status === 400) {
			error.value = 'Invalid PDF file. Please select a valid PDF file.';
		} else {
			error.value = 'Failed to convert PDF. Please try again.';
		}
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
			:disabled="!fileIsValid || isLoading"
			:loading="isLoading" 
			@click="convertPdfToHtml"
		>
			<v-icon name="transform" left />
			{{ fileIsValid ? t(button_label) : 'Please select a PDF file' }}
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