<template>
    <div
        v-if="errors.length"
        class="errors"
    >
        <v-notice
            v-for="(errorMsg, index) in errors"
            :key="index"
            type="warning"
        >
            <span>{{ t(errorMsg) }}</span>
        </v-notice>
    </div>
    <div
        v-else-if="editor"
        :class="{ disabled, fullscreen, [`toolbar-${toolbarMode}`]: true }"
        class="flexible-editor-wrapper"
    >
        <toolbar
            v-if="tools.length"
            :tools="selectedTools(tools, !!m2aField)"
            :editor="editor"
            :display-format="displayFormat"
            :single-line-mode="singleLineMode"
            :mode="toolbarMode"
        />
        <BubbleMenu
            v-if="editor"
            :editor="editor"
            :tippy-options="{ duration: 100 }"
        >
            <div v-if="editor && editor.isActive('image')" style="display: flex; gap: 8px; align-items: center; background: var(--theme--background); border: 1px solid var(--theme--border-color); border-radius: var(--theme--border-radius); padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <label style="display: flex; align-items: center; gap: 4px;">
                    <span>Alt:</span>
                    <input 
                        type="text" 
                        :value="editor.getAttributes('image').alt || ''" 
                        @input="updateImageAlt"
                        style="border: 1px solid var(--theme--border-color); border-radius: var(--theme--border-radius); padding: 4px 8px; font-size: 12px;"
                    />
                </label>
                <label style="display: flex; align-items: center; gap: 4px;">
                    <span>Title:</span>
                    <input 
                        type="text" 
                        :value="editor.getAttributes('image').title || ''" 
                        @input="updateImageTitle"
                        style="border: 1px solid var(--theme--border-color); border-radius: var(--theme--border-radius); padding: 4px 8px; font-size: 12px;"
                    />
                </label>
            </div>
        </BubbleMenu>
        <editor-content
            :editor="editor"
            :spellcheck="spellcheck ? 'true' : 'false'"
            :class="{
                [font]: true,
                [editorHeight]: true,
                'single-line': singleLineMode,
            }"
            class="flexible-editor"
        />
    </div>
</template>

<script setup lang="ts">
    // Imports
    import { ref, toRef, watch, provide, computed } from "vue";
    import { useEditor, EditorContent, type JSONContent } from "@tiptap/vue-3";
    import { v4 as uuidv4 } from "uuid";
    import Toolbar from "./components/Toolbar.vue";
    import Document from "@tiptap/extension-document";
    import Text from "@tiptap/extension-text";
    import Paragraph from "@tiptap/extension-paragraph";
    import Placeholder from "@tiptap/extension-placeholder";
    import Dropcursor from "@tiptap/extension-dropcursor";
    import Gapcursor from "@tiptap/extension-gapcursor";
    import RelationBlock from "./tools/relation-block/node-extension";
    import RelationInlineBlock from "./tools/relation-inline-block/node-extension";
    import RelationMark from "./tools/relation-mark/node-extension";
    import {
        toolsExtensions,
        interfaceOptionsDefault,
        selectedTools,
    } from "./tools";
    import { useSyncRelationNodes } from "./composables/use-sync-relation-nodes";
    import { useRelationReference } from "./composables/use-relation-reference";
    // import { useM2aStore } from './composables/use-m2a-store'
    import { useI18n } from "vue-i18n";
    import { useI18nFallback } from "./composables/use-i18n-fallback";
    import type { Collection } from "./directus-core/types/collections";
    import type { ToolbarMode, RelationReferenceAttributes } from "./types";
    import { BubbleMenu } from '@tiptap/vue-3';

    // Props
    interface Props {
        value: JSONContent | null;
        disabled: boolean;
        m2aField: string | null;
        relationBlocks: Collection[] | null;
        relationInlineBlocks: Collection[] | null;
        relationMarks: Collection[] | null;
        placeholder: string;
        inputMode: "multi" | "single";
        tools: string[];
        toolbarMode: ToolbarMode;
        displayFormat: boolean;
        font: string;
        spellcheck: boolean;
        editorHeight:
            | "height-fixed"
            | "height-grow"
            | "height-grow-till-overflow";
        field: string | null;
        collection: string | null;
        primaryKey: string | number | null;
    }
    const props = withDefaults(defineProps<Props>(), {
        value: null,
        disabled: false,
        m2aField: null,
        placeholder: "",
        inputMode: "multi",
        tools: () => interfaceOptionsDefault,
        toolbarMode: "static",
        displayFormat: false,
        font: "sans-serif",
        spellcheck: false,
        editorHeight: "height-grow-till-overflow",
        field: null,
        collection: null,
        primaryKey: null,
    });

    // I18n
    const { t } = useI18nFallback(useI18n());

    // Emits
    const emit = defineEmits(["input", "setFieldValue"]);

    // Input Mode
    const singleLineMode = computed(() => props.inputMode == "single");

    // TipTap Editor Setup
    const editor = useEditor({
        content: props.value,
        extensions: [
            Document.extend(
                singleLineMode.value ? { content: "(text|singleline)*" } : {}
            ),
            Text,
            Paragraph,
            Placeholder.configure({ placeholder: props.placeholder }),
            Dropcursor,
            Gapcursor,
            RelationBlock,
            RelationInlineBlock,
            RelationMark,
            ...toolsExtensions(props.tools),
        ],
        onCreate() {
            // called twice to reset the items even if props.value (below) is empty
            resetRelationNodes();
        },
        async onUpdate({ editor }) {
            syncRelationNodes();

            const editorValue = await editor.getJSON();
            const emptyJSON = { type: "doc", content: [{ type: "paragraph" }] };
            const isEmpty =
                JSON.stringify(editorValue) === JSON.stringify(emptyJSON);

            if (isEmpty) editor.commands.setContent(null, false);

            emit("input", isEmpty ? null : editorValue);
        },
    });
    watch(
        () => props.value,
        (value) => {
            const isSame =
                JSON.stringify(editor.value!.getJSON()) ===
                JSON.stringify(value);
            if (isSame) return;
            editor.value!.commands.setContent(value, false);
            resetRelationNodes();
        }
    );
    // The following lines are causing the update event to fire on editor creation, which leads to issues. Found out that directus disables the field globally, so this is not needed!
    watch(() => props.disabled, (disabled) =>
        editor.value!.setEditable(!disabled)
    );

    // Fallback function
    let resetRelationNodes = () => {};
    let syncRelationNodes = () => {};

    // Fullscreen mode
    const fullscreen = ref(false);
    provide("fullscreen", fullscreen);

    // Errors
    const errors = ref<string[]>([]);

    // Image editing methods for BubbleMenu
    function updateImageAlt(event: Event) {
        const target = event.target as HTMLInputElement;
        editor.value?.commands.updateAttributes('image', { alt: target.value });
    }

    function updateImageTitle(event: Event) {
        const target = event.target as HTMLInputElement;
        editor.value?.commands.updateAttributes('image', { title: target.value });
    }

    // Caption editing is now handled by the Figure node's content model
    // No additional setup needed as the figcaption is properly editable within TipTap

    if (props.m2aField) {
        const uniqueEditorField = ref(uuidv4());
        const m2aRelation = useRelationReference({
            m2aField: toRef(props, "m2aField"),
            editorField: uniqueEditorField,
            itemCollection: toRef(props, "collection"),
            itemPrimaryKey: toRef(props, "primaryKey"),
            updateM2aField: (value) =>
                emit("setFieldValue", { field: props.m2aField, value }),
            relationBlocks: toRef(props, "relationBlocks"),
            relationInlineBlocks: toRef(props, "relationInlineBlocks"),
            relationMarks: toRef(props, "relationMarks"),
        } as RelationReferenceAttributes);

        provide("m2aRelation", m2aRelation);

        errors.value = m2aRelation.errors.value;

        // sync relation nodes with M2A relation and M2A store
        const {
            initFetchedItems,
            syncRelationNodes: _syncRelationNodes,
            resetRelationNodes: _resetRelationNodes,
        } = useSyncRelationNodes({
            m2aRelation,
            editor,
            editorField: uniqueEditorField.value,
        });
        resetRelationNodes = _resetRelationNodes;
        syncRelationNodes = _syncRelationNodes;

        watch(m2aRelation.fetchedItems, initFetchedItems);
    }
</script>

<style scoped>
    .errors > div:not(:first-child) {
        margin-top: 8px;
    }

    /* Field */
    .flexible-editor-wrapper {
        color: var(--theme--form--field--input--foreground, var(--foreground));
        background-color: var(
            --theme--form--field--input--background,
            var(--background-page)
        );
        border: var(--theme--border-width, var(--border-width)) solid
            var(--theme--form--field--input--border-color, var(--border-normal));
        border-radius: var(
            --v-input-border-radius,
            var(--theme--border-radius)
        );
    }

    .flexible-editor-wrapper:not(.toolbar-floating) {
        contain: paint;
    }

    .flexible-editor-wrapper:hover {
        border-color: var(
            --theme--form--field--input--border-color-hover,
            var(--border-normal-alt)
        );
    }

    .flexible-editor-wrapper:focus-within {
        border-color: var(
            --theme--form--field--input--border-color-focus,
            var(--primary)
        );
        box-shadow: var(
            --theme--form--field--input--box-shadow-focus,
            0 0 16px -8px var(--v-input-box-shadow-color-focus)
        );
    }

    .disabled {
        color: var(
            --theme--form--field--input--foreground-subdued,
            var(--foreground-subdued)
        );
        background-color: var(
            --theme--form--field--input--background-subdued,
            var(--background-subdued)
        );
        border-color: var(
            --theme--form--field--input--border-color,
            var(--border-normal)
        );
        pointer-events: none;
    }

    .flexible-editor-wrapper.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 490;
        display: flex;
        flex-direction: column;
        border-radius: 0;
        border: none;
    }

    .flexible-editor-wrapper.fullscreen .toolbar.sticky {
        position: static;
    }

    .flexible-editor-wrapper.fullscreen .flexible-editor {
        flex-grow: 1;
        height: 0;
    }

    .flexible-editor-wrapper.fullscreen .flexible-editor :deep(.ProseMirror) {
        height: 100% !important;
        min-height: 0;
        max-height: 100%;
    }

    /* Fonts */
    .monospace {
        font-family: var(
            --theme--font-family-monospace,
            var(--family-monospace)
        );
    }

    .serif {
        font-family: var(--theme--font-family-serif, var(--family-serif));
    }

    .sans-serif {
        font-family: var(
            --theme--font-family-sans-serif,
            var(--family-sans-serif)
        );
    }

    /* Editor */
    .flexible-editor-wrapper {
        --editor-lineheight: 1.6;
        --editor-input-padding: var(
            --theme--form--field--input--padding,
            var(--input-padding)
        );
        /* --editor-height = --editor-lineheight * 7 */
        --editor-height: calc(
            11.2em + var(--editor-input-padding) + var(--editor-input-padding)
        );
        /* --editor-height = --editor-lineheight * 1 */
        --editor-height-single-line: calc(
            1.6em + var(--editor-input-padding) + var(--editor-input-padding)
        );
        --editor-overflow-height: calc(
            100vh - var(--header-bar-height) - var(--header-bar-height) -
                var(--theme--form--row-gap, var(--form-vertical-gap)) -
                var(--theme--form--row-gap, var(--form-vertical-gap)) -
                var(--editor-input-padding) - var(--editor-input-padding)
        );
    }

    .flexible-editor {
        --editor-block-mt: 24px;
    }

    .flexible-editor {
        background-color: transparent;
    }

    /* Editor Size */
    .flexible-editor :deep(.ProseMirror) {
        line-height: var(--editor-lineheight);
        padding: var(
            --theme--form--field--input--padding,
            var(--input-padding)
        );
        overflow: auto;
    }

    .flexible-editor.height-fixed :deep(.ProseMirror) {
        height: var(--editor-height);
    }

    .flexible-editor.height-fixed.single-line :deep(.ProseMirror) {
        height: var(--editor-height-single-line);
        white-space: nowrap;
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .flexible-editor.height-fixed.single-line
        :deep(.ProseMirror::-webkit-scrollbar) {
        display: none;
    }

    .flexible-editor.height-grow-till-overflow :deep(.ProseMirror),
    .flexible-editor.height-grow :deep(.ProseMirror) {
        min-height: var(--editor-height);
    }

    .flexible-editor.height-grow-till-overflow.single-line :deep(.ProseMirror),
    .flexible-editor.height-grow.single-line :deep(.ProseMirror) {
        min-height: var(--editor-height-single-line);
    }

    .flexible-editor.height-grow-till-overflow :deep(.ProseMirror) {
        max-height: var(--editor-overflow-height);
    }

    /* Editor Styles */
    .flexible-editor :deep(.ProseMirror li > * ~ :not(ul):not(ol)),
    .flexible-editor :deep(.ProseMirror li > * ~ :not(ul):not(ol) ~ *),
    .flexible-editor :deep(.ProseMirror blockquote > * ~ *),
    .flexible-editor:not(.single-line) :deep(.ProseMirror > * ~ *) {
        margin-top: var(--editor-block-mt);
    }

    .flexible-editor :deep(h1),
    .flexible-editor :deep(h2),
    .flexible-editor :deep(h3),
    .flexible-editor :deep(h4),
    .flexible-editor :deep(h5),
    .flexible-editor :deep(h6) {
        line-height: 1.4;
    }

    .flexible-editor :deep(h1) {
        font-size: 2.5em;
    }

    .flexible-editor :deep(h2) {
        font-size: 2.25em;
    }

    .flexible-editor :deep(h3) {
        font-size: 2em;
    }

    .flexible-editor :deep(h4) {
        font-size: 1.75em;
    }

    .flexible-editor :deep(h5) {
        font-size: 1.5em;
    }

    .flexible-editor :deep(h6) {
        font-size: 1.25em;
    }

    .flexible-editor :deep([textAlign="left"]) {
        text-align: left;
    }

    .flexible-editor :deep([textAlign="center"]) {
        text-align: center;
    }

    .flexible-editor :deep([textAlign="right"]) {
        text-align: right;
    }

    .flexible-editor :deep([textAlign="justify"]) {
        text-align: justify;
    }

    .flexible-editor :deep(hr) {
        color: transparent;
        background-color: var(--theme--border-color, var(--border-normal));
        height: 7px;
        border: 3px solid var(--theme--background, var(--background-page));
        border-left: none;
        border-right: none;
    }

    .flexible-editor :deep(hr.ProseMirror-selectednode) {
        border-color: var(--theme--background-normal, var(--background-normal));
    }

    .flexible-editor :deep(blockquote) {
        border-left: var(--theme--border-width, var(--border-width)) solid
            var(--theme--border-color, var(--border-normal));
        padding-left: var(
            --theme--form--field--input--padding,
            var(--input-padding)
        );
    }

    .flexible-editor :deep(strong) {
        font-weight: bold;
    }

    .flexible-editor :deep(a) {
        color: var(--theme--primary, var(--primary));
        border-bottom: 1px solid var(--theme--primary, var(--primary));
    }

    .flexible-editor :deep(.relation-mark.related-item-missing:after) {
        font-family: "Material Symbols";
        content: "warning";
        color: var(--theme--warning, var(--warning));
        vertical-align: bottom;
        padding-left: 4px;
    }

    .flexible-editor :deep(code) {
        background-color: var(
            --theme--background-normal,
            var(--background-normal)
        );
        padding: 2px 4px;
        border-radius: var(--theme--border-radius, var(--border-radius));
    }

    .flexible-editor :deep(sub),
    .flexible-editor :deep(sup) {
        font-size: 0.75em;
        line-height: 1em;
    }

    .flexible-editor :deep(pre) {
        background-color: var(
            --theme--background-normal,
            var(--background-normal)
        );
        padding: var(
            --theme--form--field--input--padding,
            var(--input-padding)
        );
        border-radius: var(--theme--border-radius, var(--border-radius));
    }

    .flexible-editor :deep(pre code) {
        padding: 0;
    }

    .flexible-editor :deep(ol),
    .flexible-editor :deep(ul) {
        padding-left: var(
            --theme--form--field--input--padding,
            var(--input-padding)
        );
    }

    .flexible-editor :deep(table) {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        margin: 0;
        overflow: hidden;
    }

    .flexible-editor :deep(table th) {
        background-color: var(--theme--background-subdued);
    }

    .flexible-editor :deep(table th),
    .flexible-editor :deep(table td) {
        padding: 0.25em 0.5em;
        border: var(--theme--border-width) solid var(--theme--border-color);
        text-align: start;
        vertical-align: top;
        box-sizing: border-box;
    }

    .flexible-editor :deep(table .selectedCell) {
        background: var(--theme--primary);
        color: var(--theme--background-subdued);
    }

    /* Placeholder */
    .flexible-editor :deep(p.is-editor-empty:first-child::before) {
        color: var(
            --theme--foreground-subdued,
            var(--v-input-placeholder-color)
        );
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }

    /* Make gap cursor appear like a normal cursor */
    .flexible-editor :deep(.ProseMirror .ProseMirror-gapcursor) {
        position: relative;
        font-size: 1em;
        line-height: var(--editor-lineheight);
    }

    .flexible-editor :deep(.ProseMirror .ProseMirror-gapcursor:after) {
        position: absolute;
        top: auto;
        right: 0;
        z-index: 1;
        bottom: var(--editor-block-mt);
        display: block;
        width: 0;
        height: 1.1em;
        /* This works as long as every block the gapcursor is appended has a height of `--input-height` */
        height: var(--theme--form--field--input--height, var(--input-height));
        border-top: none;
        border-left: 1px solid black;
    }

    .flexible-editor
        :deep(.ProseMirror .ProseMirror-gapcursor:first-child:after) {
        right: auto;
        left: 0;
        bottom: auto;
        top: 0;
    }

    /* .flexible-editor :deep(.ProseMirror:not(.ProseMirror-focused) > .ProseMirror-gapcursor:first-of-type + *) */
    .flexible-editor :deep(.ProseMirror .ProseMirror-gapcursor:first-child + *),
    .flexible-editor :deep(.ProseMirror .ProseMirror-gapcursor:last-child) {
        margin-top: 0;
    }

    .flexible-editor
        :deep(.ProseMirror .ProseMirror-gapcursor:last-child:after) {
        bottom: 0;
    }

    /* Image styles */
    .flexible-editor :deep(.editor-image) {
        max-width: 100%;
        height: auto;
        display: block;
        margin: var(--editor-block-mt) 0;
        border-radius: var(--theme--border-radius, var(--border-radius));
    }

    .flexible-editor :deep(.editor-image.ProseMirror-selectednode) {
        outline: 2px solid var(--theme--primary, var(--primary));
        outline-offset: 2px;
    }

    /* Support for inline image styles (size and alignment) */
    .flexible-editor :deep(.editor-image[style*="width"]) {
        max-width: none; /* Allow custom width from style attribute */
    }

    .flexible-editor :deep(.editor-image[style*="margin-left: auto; margin-right: auto"]) {
        display: block; /* Ensure block display for center alignment */
    }

    .flexible-editor :deep(.editor-image[style*="margin-left: auto; margin-right: 0"]) {
        display: block; /* Ensure block display for right alignment */
    }

    .flexible-editor :deep(.editor-image[style*="margin-left: 0; margin-right: auto"]) {
        display: block; /* Ensure block display for left alignment */
    }

    /* OLD Figure styles - COMMENTED OUT - See UPDATED Figure styles below */
    /*
    .flexible-editor :deep(.editor-figure) {
        align-items: center;
        border: 2px solid var(--theme--border-color, var(--border-normal));
        border-radius: var(--theme--border-radius, var(--border-radius));
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: var(--editor-block-mt) 0;
        padding: 0.5rem;
        width: 100%;
        box-sizing: border-box;
    }

    .flexible-editor :deep(.editor-figure.ProseMirror-selectednode) {
        border-color: var(--theme--primary, var(--primary));
    }

    .flexible-editor :deep(.editor-figure > img) {
        margin: 0;
        max-width: 100%;
        align-self: center;
    }

    .flexible-editor :deep(.editor-figcaption) {
        border-radius: var(--theme--border-radius, var(--border-radius));
        border: 2px dashed transparent;
        padding: 0.5rem;
        text-align: center;
        width: 100%;
        min-height: 1.5em;
        outline: none;
        box-sizing: border-box;
        cursor: text;
    }

    .flexible-editor :deep(.editor-figcaption:focus) {
        border-color: var(--theme--primary, var(--primary));
        background-color: var(--theme--background-normal, var(--background-normal));
    }

    .flexible-editor :deep(.editor-figcaption:hover) {
        border-color: var(--theme--border-color-hover, var(--border-normal));
    }

    .flexible-editor :deep(.editor-figcaption:empty::before) {
        content: "Add your caption here...";
        color: var(--theme--foreground-subdued, var(--foreground-subdued));
        font-style: italic;
        pointer-events: none;
    }

    .flexible-editor :deep(.editor-figcaption[data-placeholder]:empty::before) {
        content: attr(data-placeholder);
        color: var(--theme--foreground-subdued, var(--foreground-subdued));
        font-style: italic;
        pointer-events: none;
    }
    */

    /* OLD Figure styles - COMMENTED OUT - See UPDATED Figure styles below */
    /*
    .flexible-editor :deep(.editor-figure) {
        align-items: center;
        border: 2px solid var(--theme--border-color, var(--border-normal));
        border-radius: var(--theme--border-radius, var(--border-radius));
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: var(--editor-block-mt) 0;
        padding: 0.5rem;
        width: 100%;
        box-sizing: border-box;
    }

    .flexible-editor :deep(.editor-figure.ProseMirror-selectednode) {
        border-color: var(--theme--primary, var(--primary));
    }

    .flexible-editor :deep(.editor-figure > img) {
        margin: 0;
        max-width: 100%;
        align-self: center;
    }

    .flexible-editor :deep(.editor-figcaption) {
        border-radius: var(--theme--border-radius, var(--border-radius));
        border: 2px dashed transparent;
        padding: 0.5rem;
        text-align: center;
        width: 100%;
        min-height: 1.5em;
        outline: none;
        box-sizing: border-box;
        cursor: text;
    }

    .flexible-editor :deep(.editor-figcaption:focus) {
        border-color: var(--theme--primary, var(--primary));
        background-color: var(--theme--background-normal, var(--background-normal));
    }

    .flexible-editor :deep(.editor-figcaption:hover) {
        border-color: var(--theme--border-color-hover, var(--border-normal));
    }

    .flexible-editor :deep(.editor-figcaption:empty::before) {
        content: "Add your caption here...";
        color: var(--theme--foreground-subdued, var(--foreground-subdued));
        font-style: italic;
        pointer-events: none;
    }

    .flexible-editor :deep(.editor-figcaption[data-placeholder]:empty::before) {
        content: attr(data-placeholder);
        color: var(--theme--foreground-subdued, var(--foreground-subdued));
        font-style: italic;
        pointer-events: none;
    }
    */
    /* UPDATED Figure styles - Updated to support inline display and proper caption width */
    .flexible-editor :deep(.editor-figure) {
        display: block;
        margin: var(--editor-block-mt) 0;
        padding: 0;
        box-sizing: border-box;
        width: 100%;
        position: relative;
    }
    
    /* Create an inner wrapper for image and caption */
    .flexible-editor :deep(.editor-figure) {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    /* Figure alignment based on style - using float approach for proper alignment */
    .flexible-editor :deep(.editor-figure[style*="margin-left: 0; margin-right: auto"]) {
        text-align: left;
    }
    
    .flexible-editor :deep(.editor-figure[style*="margin-left: auto; margin-right: auto"]) {
        text-align: center;
    }
    
    .flexible-editor :deep(.editor-figure[style*="margin-left: auto; margin-right: 0"]) {
        text-align: right;
    }
    
    /* Image styles */
    .flexible-editor :deep(.editor-figure > img) {
        margin: 0;
        height: auto;
        display: inline-block;
        vertical-align: bottom;
    }
    
    /* Apply image width based on style attribute */
    .flexible-editor :deep(.editor-figure > img[style*="width: 35%"]) {
        width: 35%;
    }
    
    .flexible-editor :deep(.editor-figure > img[style*="width: 50%"]) {
        width: 50%;
    }
    
    .flexible-editor :deep(.editor-figure > img[style*="width: 75%"]) {
        width: 75%;
    }
    
    .flexible-editor :deep(.editor-figure > img[style*="width: 100%"]) {
        width: 100%;
    }

    .flexible-editor :deep(.editor-figure.ProseMirror-selectednode) {
        outline: 2px solid var(--theme--primary, var(--primary));
        outline-offset: 2px;
    }

    .flexible-editor :deep(.editor-figcaption) {
        border-radius: var(--theme--border-radius, var(--border-radius));
        border: 2px dashed transparent;
        padding: 0.5rem;
        text-align: inherit; /* Inherit alignment from parent by default */
        display: inline-block;
        min-height: 1.5em;
        outline: none;
        box-sizing: border-box;
        cursor: text;
        background-color: var(--theme--background-subdued, var(--background-subdued));
        font-size: 0.9em;
        line-height: 1.4;
    }
    
    /* Make caption match image width */
    .flexible-editor :deep(.editor-figure > img[style*="width: 35%"] ~ .editor-figcaption) {
        width: 35%;
    }
    
    .flexible-editor :deep(.editor-figure > img[style*="width: 50%"] ~ .editor-figcaption) {
        width: 50%;
    }
    
    .flexible-editor :deep(.editor-figure > img[style*="width: 75%"] ~ .editor-figcaption) {
        width: 75%;
    }
    
    .flexible-editor :deep(.editor-figure > img[style*="width: 100%"] ~ .editor-figcaption) {
        width: 100%;
    }
    
    /* Support text alignment within captions */
    .flexible-editor :deep(.editor-figcaption[style*="text-align: left"]) {
        text-align: left;
    }
    
    .flexible-editor :deep(.editor-figcaption[style*="text-align: center"]) {
        text-align: center;
    }
    
    .flexible-editor :deep(.editor-figcaption[style*="text-align: right"]) {
        text-align: right;
    }
    
    .flexible-editor :deep(.editor-figcaption[style*="text-align: justify"]) {
        text-align: justify;
    }
    
    /* Support text formatting in captions */
    .flexible-editor :deep(.editor-figcaption strong) {
        font-weight: bold;
    }
    
    .flexible-editor :deep(.editor-figcaption em) {
        font-style: italic;
    }
    
    .flexible-editor :deep(.editor-figcaption a) {
        color: var(--theme--primary, var(--primary));
        text-decoration: underline;
    }
    
    .flexible-editor :deep(.editor-figcaption code) {
        background-color: var(--theme--background-normal, var(--background-normal));
        padding: 0.1em 0.3em;
        border-radius: var(--theme--border-radius, var(--border-radius));
        font-family: var(--theme--font-family-monospace, var(--family-monospace));
        font-size: 0.9em;
    }
    
    .flexible-editor :deep(.editor-figcaption sub),
    .flexible-editor :deep(.editor-figcaption sup) {
        font-size: 0.75em;
        line-height: 0;
    }
    
    .flexible-editor :deep(.editor-figcaption s) {
        text-decoration: line-through;
    }

    .flexible-editor :deep(.editor-figcaption:focus) {
        border-color: var(--theme--primary, var(--primary));
        background-color: var(--theme--background-normal, var(--background-normal));
    }

    .flexible-editor :deep(.editor-figcaption:hover) {
        border-color: var(--theme--border-color-hover, var(--border-normal));
    }

    .flexible-editor :deep(.editor-figcaption:empty::before) {
        content: "Add your caption here...";
        color: var(--theme--foreground-subdued, var(--foreground-subdued));
        font-style: italic;
        pointer-events: none;
    }

    .flexible-editor :deep(.editor-figcaption[data-placeholder]:empty::before) {
        content: attr(data-placeholder);
        color: var(--theme--foreground-subdued, var(--foreground-subdued));
        font-style: italic;
        pointer-events: none;
    }
</style>

<style>
    /* not scoped */
    .prosemirror-dropcursor-block {
        background-color: var(
            --theme--border-color,
            var(--border-normal)
        ) !important;
    }
</style>
