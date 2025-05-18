<template>
	<div class="layout-container" :class="{ 'dense': dense }">
	<!-- Layout header -->
	<div class="layout-header">
		<v-button v-if="selection.length > 0" class="header-button" @click="clearSelection">
		{{ selection.length }} {{ selection.length === 1 ? 'item' : 'items' }} selected
		<v-icon name="close" />
		</v-button>
		
		<v-button class="header-button" @click="refreshItems">
		<v-icon name="refresh" />
		Refresh
		</v-button>
	
		<v-button class="header-button" @click="openDocsConverter">
		<v-icon name="text_format" />
		Convert Documents
		</v-button>
	</div>
	
	<!-- Files grid view -->
	<div class="files-grid" :class="{ 'dense': dense }">
		<div
		v-for="item in items"
		:key="item[primaryKeyField]"
		class="file-card"
		:class="{ 'selected': selection.includes(item[primaryKeyField]) }"
		@click="onClickItem(item)"
		>
		<div class="thumbnail">
			<img v-if="isImage(item)" :src="getThumbnailUrl(item)" alt="Thumbnail" />
			<v-icon v-else-if="isHtml(item)" name="code" size="xlarge" />
			<v-icon v-else name="description" size="xlarge" />
		</div>
		<div class="file-info">
			<div class="file-name">{{ item.title || item.filename_download }}</div>
			<div class="file-meta">{{ formatFileSize(item.filesize) }}</div>
		</div>
		</div>
	</div>
	
	<!-- No items placeholder -->
	<v-info v-if="items.length === 0" icon="info" center>
		No files found
	</v-info>
	
	<!-- Google Docs converter dialog -->
	<v-dialog
		v-model="showConverter"
		@esc="showConverter = false"
		:persistent="false"
	>
		<v-card class="converter-dialog">
		<v-card-title>Convert Google Docs to HTML</v-card-title>
		<v-card-text>
			<iframe
			:src="`/admin/extensions/module/google-docs-to-html`"
			class="converter-iframe"
			title="Google Docs to HTML Converter"
			></iframe>
		</v-card-text>
		<v-card-actions>
			<v-button @click="showConverter = false">Close</v-button>
		</v-card-actions>
		</v-card>
	</v-dialog>
	</div>
	</template>
	
	<script>
	export default {
	name: 'GoogleDocsToHtmlLayout',
	props: {
	collection: {
		type: String,
		required: true,
	},
	selection: {
		type: Array,
		default: () => [],
	},
	layoutOptions: {
		type: Object,
		default: () => ({}),
	},
	layoutQuery: {
		type: Object,
		default: () => ({}),
	},
	filters: {
		type: Array,
		default: () => [],
	},
	searchQuery: {
		type: String,
		default: null,
	},
	showSelect: {
		type: Boolean,
		default: false,
	},
	selectMode: {
		type: Boolean,
		default: false,
	},
	readonly: {
		type: Boolean,
		default: false,
	},
	items: {
		type: Array,
		default: () => [],
	},
	loading: {
		type: Boolean,
		default: false,
	},
	error: {
		type: Object,
		default: null,
	},
	primaryKeyField: {
		type: String,
		default: 'id',
	},
	page: {
		type: Number,
		default: 1,
	},
	totalPages: {
		type: Number,
		default: 1,
	},
	itemCount: {
		type: Number,
		default: 0,
	},
	totalCount: {
		type: Number,
		default: 0,
	},
	referenceFilter: {
		type: Object,
		default: null,
	},
	},
	emits: [
	'update:selection',
	'item-click',
	'update:page',
	'refresh',
	'update:sort',
	],
	data() {
	return {
		showConverter: false,
		dense: this.layoutOptions?.dense || false,
	};
	},
	watch: {
	layoutOptions: {
		handler(options) {
		this.dense = options?.dense || false;
		},
		immediate: true,
		deep: true,
	},
	},
	methods: {
	openDocsConverter() {
		this.showConverter = true;
	},
	onClickItem(item) {
		if (this.selectMode) {
		this.toggleSelect(item);
		} else {
		this.$emit('item-click', item);
		}
	},
	toggleSelect(item) {
		const id = item[this.primaryKeyField];
		const newSelection = [...this.selection];
		
		if (newSelection.includes(id)) {
		newSelection.splice(newSelection.indexOf(id), 1);
		} else {
		newSelection.push(id);
		}
		
		this.$emit('update:selection', newSelection);
	},
	clearSelection() {
		this.$emit('update:selection', []);
	},
	refreshItems() {
		this.$emit('refresh');
	},
	isImage(item) {
		return item.type && item.type.startsWith('image/');
	},
	isHtml(item) {
		return item.type === 'text/html' ||
		(item.filename_download && item.filename_download.endsWith('.html'));
	},
	getThumbnailUrl(item) {
		return `/assets/${item.id}?key=system-small-cover`;
	},
	formatFileSize(bytes) {
		if (bytes === 0 || !bytes) return '0 Bytes';
		
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
	}
	};
	</script>
	
	<style scoped>
	.layout-container {
	width: 100%;
	height: 100%;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	overflow: auto;
	}
	
	.layout-header {
	display: flex;
	align-items: center;
	gap: 8px;
	}
	
	.header-button {
	margin-right: 8px;
	display: flex;
	align-items: center;
	gap: 4px;
	}
	
	.files-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 20px;
	}
	
	.files-grid.dense {
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 12px;
	}
	
	.file-card {
	border: 2px solid var(--border-normal);
	border-radius: 4px;
	overflow: hidden;
	cursor: pointer;
	transition: all 0.1s ease;
	}
	
	.file-card:hover {
	border-color: var(--primary);
	transform: translateY(-2px);
	box-shadow: 0 2px 8px var(--border-normal);
	}
	
	.file-card.selected {
	border-color: var(--primary);
	background-color: var(--primary-alt);
	}
	
	.thumbnail {
	height: 150px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--background-subdued);
	overflow: hidden;
	}
	
	.files-grid.dense .thumbnail {
	height: 120px;
	}
	
	.thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	}
	
	.file-info {
	padding: 12px;
	}
	
	.file-name {
	font-weight: bold;
	margin-bottom: 4px;
	word-break: break-word;
	}
	
	.file-meta {
	font-size: 12px;
	color: var(--foreground-subdued);
	}
	
	.converter-dialog {
	width: 90vw;
	max-width: 1200px;
	max-height: 90vh;
	}
	
	.converter-iframe {
	width: 100%;
	height: 70vh;
	border: none;
	}
	</style>