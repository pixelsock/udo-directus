<template>
  <div class="pdf-viewer">
    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate color="primary" />
      <span>Loading PDF...</span>
    </div>
    <div v-else-if="error" class="error">
      <v-icon color="error" large>error</v-icon>
      <span>Unable to load PDF</span>
    </div>
    <div v-else-if="!fileId" class="no-file">
      <v-icon large>insert_drive_file</v-icon>
      <span>No PDF selected</span>
    </div>
    <div v-else class="pdf-container" :style="{ height: containerHeight + 'px' }">
      <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useApi } from '@directus/extensions-sdk';

// Utility to safely convert any value to a string or null
function safeString(val) {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' && !isNaN(val)) return String(val);
  return null;
}

// Dynamically import PDF.js
const pdfjsLib = import('pdfjs-dist/build/pdf');
const pdfjsWorker = import('pdfjs-dist/build/pdf.worker.entry');

export default {
  props: {
    value: {
      type: [String, Object, Number],
      default: null,
    },
    interfaceOptions: {
      type: Object,
      default: () => ({
        height: 500
      }),
    },
    collection: {
      type: String,
      default: '',
    },
    field: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    primaryKey: {
      type: [String, Number],
      default: null,
    },
  },
  emits: ['input'],
  setup(props) {
    const api = useApi();
    const pdfCanvas = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const fileId = ref(null);
    const pdfInstance = ref(null);
    const currentPage = ref(1);
    const pageCount = ref(0);
    const scale = ref(1.5);

    // Compute container height from options with fallback
    const containerHeight = computed(() => {
      return props.interfaceOptions?.height || 500;
    });

    // Extract file ID from value (handles string, object, or number)
    const extractFileId = (value) => {
      if (value === null || value === undefined) return null;

      // Handle string values
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }

      // Handle number values
      if (typeof value === 'number' && !isNaN(value)) {
        return String(value);
      }

      // Handle object values with id property
      if (typeof value === 'object' && value !== null) {
        if (typeof value.id === 'string') {
          const trimmed = value.id.trim();
          return trimmed.length > 0 ? trimmed : null;
        }
        if (typeof value.id === 'number' && !isNaN(value.id)) {
          return String(value.id);
        }
      }

      return null;
    };

    // Helper function to clear the canvas
    const clearCanvas = () => {
      if (pdfCanvas.value) {
        const ctx = pdfCanvas.value.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, pdfCanvas.value.width, pdfCanvas.value.height);
        }
      }
    };

    // Get PDF file URL from Directus
    const getPdfUrl = (id) => {
      const safeId = safeString(id);
      if (!safeId || !safeId.trim()) {
        console.warn('Invalid file ID provided to getPdfUrl:', id);
        return null;
      }

      try {
        const baseUrl = api?.defaults?.baseURL || window.location.origin;
        return `${baseUrl}/assets/${encodeURIComponent(safeId.trim())}`;
      } catch (err) {
        console.error('Error generating PDF URL:', err);
        return null;
      }
    };

    // Render PDF page
    const renderPage = async (pdf, pageNum) => {
      if (!pdf || !pageNum || !pdfCanvas.value) return;

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale.value });

        // Set canvas dimensions
        const canvas = pdfCanvas.value;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        error.value = null;
      } catch (err) {
        console.error('Error rendering PDF page:', err);
        error.value = 'Error rendering PDF: ' + (err.message || 'Unknown error');
      }
    };

    // Load and render PDF
    const loadPdf = async () => {
      // Validate file ID
      const id = extractFileId(fileId.value);
      if (!id || typeof id !== 'string' || !id.trim()) {
        error.value = 'No valid file ID provided';
        loading.value = false;
        clearCanvas();
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        // Initialize PDF.js
        const pdfjs = await pdfjsLib;

        // Set worker
        const worker = await pdfjsWorker;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;

        // Get the PDF URL
        const url = getPdfUrl(id);
        if (!url) {
          throw new Error('Could not generate PDF URL');
        }

        // Load the PDF document
        pdfInstance.value = await pdfjs.getDocument({
          url,
          withCredentials: true,
        }).promise;

        // Update page count
        pageCount.value = pdfInstance.value.numPages;

        // Render first page if available
        if (pageCount.value > 0) {
          await renderPage(pdfInstance.value, currentPage.value);
        } else {
          throw new Error('PDF has no pages');
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        error.value = 'Failed to load PDF: ' + (err.message || 'Unknown error');
        clearCanvas();
      } finally {
        loading.value = false;
      }
    };

    // Watch for changes in the value prop
    watch(() => props.value, (newVal) => {
      try {
        // Safely extract the file ID, handling all possible input types
        const newFileId = extractFileId(newVal);

        // Only reload if the file ID has changed
        if (newFileId !== fileId.value) {
          fileId.value = newFileId !== undefined ? newFileId : null;

          if (fileId.value) {
            // Load the PDF if we have a valid file ID
            loadPdf();
          } else {
            // Clear the canvas if no file is selected
            clearCanvas();
            // Reset error state
            error.value = null;
          }
        }
      } catch (err) {
        console.error('Error processing file value:', err, newVal);
        error.value = 'Error processing file: ' + (err.message || 'Unknown error');
        // Clear the canvas on error
        clearCanvas();
        fileId.value = null;
      }
    }, { immediate: true });

    // Cleanup
    onBeforeUnmount(() => {
      if (pdfInstance.value) {
        try {
          pdfInstance.value.destroy();
        } catch (e) {
          console.error('Error cleaning up PDF instance:', e);
        }
      }
    });

    return {
      pdfCanvas,
      loading,
      error,
      fileId,
      currentPage,
      pageCount,
      containerHeight,
    };
  },
};
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  min-height: 100px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5;
}

.loading,
.error,
.no-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #666;
  height: 200px;
}

.error {
  color: #f44336;
}

.pdf-container {
  width: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  background-color: #525659;
  padding: 20px 0;
}

.pdf-canvas {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin: 0 auto;
  background: white;
}
</style>