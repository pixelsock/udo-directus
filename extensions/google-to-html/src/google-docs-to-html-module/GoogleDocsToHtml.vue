<template>
  <div class="google-docs-to-html">
    <!-- Banner if Pandoc is not available -->
    <v-notice v-if="!isPandocInstalled" type="warning">
      Pandoc is not installed or not configured correctly. Please make sure Pandoc is installed on the server.
    </v-notice>

    <div class="main-container">
      <h1 class="title">Google Docs to HTML Converter</h1>

      <!-- Upload Section -->
      <section class="upload-section">
        <div
          class="drop-area"
          @dragover.prevent
          @dragenter.prevent
          @drop.prevent="onDrop"
        >
          <div v-if="!uploadedFile">
            <p>Drag & drop a .docx, .odt, .html, or .rtf file here, or</p>
            <input
              type="file"
              accept=".docx,.odt,.html,.rtf"
              @change="onFileChange"
              :disabled="converting || !isPandocInstalled"
            />
          </div>
          <div v-else class="file-info">
            <v-icon name="description" />
            <span>{{ uploadedFile.name }}</span>
            <v-button small @click="removeFile" :disabled="converting">Remove</v-button>
          </div>
        </div>
        <v-button
          :loading="converting"
          :disabled="!uploadedFile || !isPandocInstalled"
          class="convert-btn"
          @click="convertFile"
        >
          Convert to HTML
        </v-button>
        <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
      </section>

      <!-- Paste Section -->
      <section class="paste-section">
        <h2>Paste Content</h2>
        <v-textarea
          v-model="pastedContent"
          placeholder="Paste your Google Docs content here..."
          :disabled="converting"
        />
        <v-button
          :loading="converting"
          :disabled="!pastedContent || !isPandocInstalled"
          @click="convertPastedContent"
        >
          Convert to HTML
        </v-button>
      </section>

      <!-- Output Section -->
      <section class="output-section">
        <div v-if="converting" class="status converting">
          <v-progress-circular indeterminate color="primary" />
          <span>Converting...</span>
        </div>
        <div v-else-if="errorMessage" class="status error">
          <v-notice type="danger">{{ errorMessage }}</v-notice>
        </div>
        <div v-else-if="htmlOutput" class="output-tabs">
          <v-tabs v-model="outputTab">
            <v-tab value="preview">Preview</v-tab>
            <v-tab value="source">HTML Source</v-tab>
          </v-tabs>
          <div v-if="outputTab === 'preview'" class="preview-pane">
            <div v-html="htmlOutput"></div>
          </div>
          <div v-else-if="outputTab === 'source'" class="source-pane">
            <pre style="white-space:pre-wrap; word-break:break-all; background:var(--background-page); border:1px solid var(--border-normal); border-radius:4px; padding:12px; max-height:400px; overflow:auto; font-size:13px;">
              <code v-text="htmlOutput"></code>
            </pre>
            <div class="action-buttons">
              <v-button @click="copyHtml">Copy HTML</v-button>
              <v-button @click="showSaveDialog = true">Save as File</v-button>
            </div>
          </div>
        </div>
        <div v-else class="status empty">
          <span>No output yet. Upload or paste content to convert.</span>
        </div>
      </section>

      <!-- Conversion History Section -->
      <section class="history-section" v-if="conversionHistory.length">
        <h2>Conversion History</h2>
        <ul>
          <li v-for="(item, idx) in conversionHistory" :key="idx">
            <span>{{ item.filename }}</span>
            <v-button small @click="viewHistory(idx)">View</v-button>
          </li>
        </ul>
      </section>
    </div>

    <!-- Save Dialog -->
    <v-dialog v-model="showSaveDialog" @esc="showSaveDialog = false">
      <v-card>
        <v-card-title>Save HTML as File</v-card-title>
        <v-card-text>
          <v-input v-model="saveFilename" placeholder="Enter filename" />
          <small class="description">
            The HTML will be saved as a file in the Directus Files library.
          </small>
        </v-card-text>
        <v-card-actions>
          <v-button secondary @click="showSaveDialog = false">Cancel</v-button>
          <v-button :loading="saving" :disabled="!saveFilename" @click="saveAsFile">Save</v-button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();
const router = inject('router', null);
const notify = inject('useNotifications', null);

const uploadedFile = ref(null);
const pastedContent = ref('');
const htmlOutput = ref('');
const converting = ref(false);
const isPandocInstalled = ref(true);
const showSaveDialog = ref(false);
const saveFilename = ref('');
const saving = ref(false);
const errorMessage = ref('');
const uploadError = ref('');
const outputTab = ref('preview');

// Defensive: Only allow valid tab values
function setOutputTab(tab) {
  if (tab === 'preview' || tab === 'source') {
    outputTab.value = tab;
  }
}

// Watch htmlOutput: if cleared, reset tab
import { watch } from 'vue';
watch(htmlOutput, (val) => {
  if (!val) outputTab.value = 'preview';
});
const conversionHistory = ref([]);

onMounted(() => {
  checkPandoc();
});

async function checkPandoc() {
  try {
    const response = await api.get('/google-docs-to-html-endpoint/status');
    isPandocInstalled.value = response.data.status === 'ok';
  } catch (error) {
    isPandocInstalled.value = false;
  }
}

function onFileChange(e) {
  uploadError.value = '';
  errorMessage.value = '';
  htmlOutput.value = '';
  const file = e.target.files[0];
  validateAndSetFile(file);
}

function onDrop(e) {
  uploadError.value = '';
  errorMessage.value = '';
  htmlOutput.value = '';
  const file = e.dataTransfer.files[0];
  validateAndSetFile(file);
}

function validateAndSetFile(file) {
  if (!file) {
    uploadedFile.value = null;
    return;
  }
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.oasis.opendocument.text', // .odt
    'text/html',
    'application/rtf',
  ];
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Unsupported file type. Please upload a .docx, .odt, .html, or .rtf file.';
    uploadedFile.value = null;
    return;
  }
  uploadedFile.value = file;
}

function removeFile() {
  uploadedFile.value = null;
  htmlOutput.value = '';
  errorMessage.value = '';
  uploadError.value = '';
}

function handleApiError(error, message) {
  const errorMsg = error.response?.data?.message || error.message || 'Unknown error occurred';
  errorMessage.value = `${message}: ${errorMsg}`;
  if (notify) {
    notify({
      title: 'Error',
      text: `${message}: ${errorMsg}`,
      type: 'error',
    });
  } else {
    alert(`${message}: ${errorMsg}`);
  }
}

async function convertFile() {
  if (!uploadedFile.value) return;
  htmlOutput.value = '';
  errorMessage.value = '';
  converting.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadedFile.value);
    const response = await api.post('/google-docs-to-html-endpoint/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data.data && response.data.data.html) {
      htmlOutput.value = response.data.data.html;
      outputTab.value = 'preview';
      saveFilename.value = uploadedFile.value.name.replace(/\.[^/.]+$/, '') + '.html';
      addToHistory(uploadedFile.value.name, htmlOutput.value);
    } else {
      errorMessage.value = 'No HTML output was returned from the conversion.';
    }
  } catch (error) {
    handleApiError(error, 'Failed to convert file');
  } finally {
    converting.value = false;
  }
}

async function convertPastedContent() {
  if (!pastedContent.value) return;
  htmlOutput.value = '';
  errorMessage.value = '';
  converting.value = true;
  try {
    const response = await api.post('/google-docs-to-html-endpoint/paste', {
      content: pastedContent.value,
      format: 'html',
    });
    if (response.data.data && response.data.data.html) {
      htmlOutput.value = response.data.data.html;
      outputTab.value = 'preview';
      saveFilename.value = 'converted-document.html';
      addToHistory('Pasted Content', htmlOutput.value);
    } else {
      errorMessage.value = 'No HTML output was returned from the conversion.';
    }
  } catch (error) {
    handleApiError(error, 'Failed to convert content');
  } finally {
    converting.value = false;
  }
}

function addToHistory(filename, html) {
  conversionHistory.value.unshift({ filename, html });
  if (conversionHistory.value.length > 5) conversionHistory.value.length = 5;
}

function viewHistory(idx) {
  const item = conversionHistory.value[idx];
  if (item) {
    htmlOutput.value = item.html;
    saveFilename.value = item.filename.replace(/\.[^/.]+$/, '') + '.html';
    outputTab.value = 'preview';
  }
}

async function saveAsFile() {
  if (!htmlOutput.value || !saveFilename.value) return;
  saving.value = true;
  try {
    const response = await api.post('/google-docs-to-html-endpoint/save', {
      html: htmlOutput.value,
      filename: saveFilename.value,
    });
    if (notify) {
      notify({
        title: 'Success',
        text: `HTML saved as ${response.data.data.filename}`,
        type: 'success',
      });
    } else {
      alert(`HTML saved as ${response.data.data.filename}`);
    }
    showSaveDialog.value = false;
    if (router) {
      router.push(`/files/${response.data.data.id}`);
    }
  } catch (error) {
    handleApiError(error, 'Failed to save HTML as file');
  } finally {
    saving.value = false;
  }
}

function copyHtml() {
  navigator.clipboard.writeText(htmlOutput.value)
    .then(() => {
      if (notify) {
        notify({
          title: 'Success',
          text: 'HTML copied to clipboard',
          type: 'success',
        });
      } else {
        alert('HTML copied to clipboard');
      }
    })
    .catch((error) => {
      if (notify) {
        notify({
          title: 'Error',
          text: 'Failed to copy HTML to clipboard',
          type: 'error',
        });
      } else {
        alert('Failed to copy HTML to clipboard');
      }
    });
}
</script>

<style scoped>
.google-docs-to-html {
  padding: 32px 0 0 0;
  background: var(--background-page);
  min-height: 100vh;
}

.main-container {
  max-width: 700px;
  margin: 0 auto;
  background: var(--background-normal);
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  padding: 32px 32px 40px 32px;
}

.title {
  margin-bottom: 24px;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
}

.upload-section, .paste-section, .output-section, .history-section {
  margin-bottom: 32px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-area {
  border: 2px dashed var(--border-normal);
  border-radius: 8px;
  padding: 28px 18px;
  width: 100%;
  margin-bottom: 16px;
  text-align: center;
  background: var(--background-page);
  transition: border-color 0.2s;
}
.drop-area.dragover {
  border-color: var(--primary);
  background: var(--primary-subdued);
}
.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  margin-bottom: 8px;
}
.convert-btn {
  margin-bottom: 8px;
}
.error-message {
  color: var(--danger);
  font-size: 0.96rem;
  margin-top: 6px;
}

.paste-section {
  padding-top: 10px;
}
.paste-section h2 {
  font-size: 1.14rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.output-section {
  padding-top: 10px;
}
.output-tabs {
  margin-top: 12px;
}
.preview-pane {
  border: 1px solid var(--border-normal);
  border-radius: 4px;
  min-height: 180px;
  max-height: 400px;
  overflow: auto;
  background: var(--background-page);
  padding: 18px;
  margin-top: 6px;
}
.source-pane {
  margin-top: 8px;
}
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
}
.status.empty {
  color: var(--foreground-subdued);
  font-size: 1.04rem;
}
.status.error {
  color: var(--danger);
}

.history-section {
  border-top: 1px solid var(--border-normal);
  padding-top: 18px;
}
.history-section h2 {
  font-size: 1.08rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.history-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.history-section li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
</style>