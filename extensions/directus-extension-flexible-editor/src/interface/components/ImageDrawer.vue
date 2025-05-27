<script setup lang="ts">
import type { File, SettingsStorageAssetPreset } from '@directus/types';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue: boolean;
	imageSelection: any;
	storageAssetTransform: string;
	storageAssetPresets: SettingsStorageAssetPreset[];
	folder: string | undefined;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
	(e: 'closeImageDrawer'): void;
	(e: 'onImageSelect', image: File): void;
	(e: 'saveImage'): void;
}>();

const { t } = useI18n();

function closeDrawer() {
	emit('update:modelValue', false);
	emit('closeImageDrawer');
}

function onImageSelect(file: File) {
	emit('onImageSelect', file);
}

function saveImage() {
	emit('saveImage');
}

function getWidth(size: string) {
	switch (size) {
		case 'small': return '25%';
		case 'medium': return '50%';
		case 'large': return '75%';
		case 'full': return '100%';
		default: return 'auto';
	}
}
</script>

<template>
	<VDrawer :model-value="props.modelValue" @update:model-value="val => emit('update:modelValue', val)" :title="t('wysiwyg_options.image')" icon="image" @cancel="closeDrawer">
		<div class="content">
			<div v-if="props.imageSelection">
				<img class="image-preview"
					 :src="props.imageSelection.previewUrl"
					 :style="{
						width: getWidth(props.imageSelection.size),
						display: 'block',
						marginLeft: props.imageSelection.alignment === 'center' ? 'auto' : undefined,
						marginRight: props.imageSelection.alignment === 'center' ? 'auto' : undefined,
						float: props.imageSelection.alignment === 'left' ? 'left' : props.imageSelection.alignment === 'right' ? 'right' : undefined
					 }"
				>
				<div class="grid">
					<div class="field half">
						<div class="type-label">
							{{ t('image_url') }}
						</div>
						<VInput v-model="props.imageSelection.imageUrl" />
					</div>
					<div
							v-if="props.storageAssetTransform !== 'none' && props.storageAssetPresets.length > 0"
							class="field half-right"
					>
						<div class="type-label">
							{{ t('transformation_preset_key') }}
						</div>
						<VSelect
								v-model="props.imageSelection.transformationKey"
								v-bind:items="props.storageAssetPresets.map((preset) => ({ text: preset.key, value: preset.key }))"
								show-deselect
						></VSelect>
					</div>
					<div v-if="props.storageAssetTransform === 'all'">
						<div class="field half">
							<div class="type-label">
								{{ t('width') }}
							</div>
							<VInput
									v-model="props.imageSelection.width"
									:disabled="!!props.imageSelection.transformationKey"
							/>
						</div>
						<div class="field half-right">
							<div class="type-label">
								{{ t('height') }}
							</div>
							<VInput
									v-model="props.imageSelection.height"
									:disabled="!!props.imageSelection.transformationKey"
							/>
						</div>
					</div>
					<div class="field half">
						<div class="type-label">Alignment</div>
						<VSelect v-model="props.imageSelection.alignment" :items="[{text:'Left',value:'left'},{text:'Center',value:'center'},{text:'Right',value:'right'}]" />
					</div>
					<div class="field half-right">
						<div class="type-label">Size</div>
						<VSelect v-model="props.imageSelection.size" :items="[{text:'Small',value:'small'},{text:'Medium',value:'medium'},{text:'Large',value:'large'},{text:'Full',value:'full'}]" />
					</div>
					<div class="field full">
						<VCheckbox v-model="props.imageSelection.showCaption" label="Add caption" />
						<VInput v-if="props.imageSelection.showCaption" v-model="props.imageSelection.caption" label="Caption" />
					</div>
					<slot name="additionalFields" />
				</div>
			</div>
			<VUpload v-else :multiple="false" from-library from-url :folder="props.folder" @input="onImageSelect"></VUpload>
		</div>

		<template #actions>
			<VButton v-tooltip.bottom="t('save_image')" icon rounded @click="saveImage">
				<VIcon name="check" />
			</VButton>
		</template>
	</VDrawer>
</template>

<style scoped lang="scss">
.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.image-preview {
	width: 100%;
	height: var(--input-height-tall);
	margin-bottom: 24px;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}

.grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.body {
	padding: 20px;
}
</style> 