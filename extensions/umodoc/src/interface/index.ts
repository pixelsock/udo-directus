import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
    id: "umo-editor-interface",
    name: "Umo Editor",
    icon: "description",
    description: "A rich document editor based on Umo Editor (Vue3 + Tiptap)",
    component: InterfaceComponent,
    types: ["json"],
    group: "standard",
    recommendedDisplays: ["umo-editor-display"],
    preview: `<svg width="156" height="96" viewBox="0 0 156 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M132 16H24C21.2386 16 19 18.2386 19 21V75C19 77.7614 21.2386 80 24 80H132C134.761 80 137 77.7614 137 75V21C137 18.2386 134.761 16 132 16Z" stroke="var(--theme--primary, var(--primary))" stroke-width="2"/>
        <path d="M32 23H28C26.8954 23 26 23.8954 26 25V29C26 30.1046 26.8954 31 28 31H32C33.1046 31 34 30.1046 34 29V25C34 23.8954 33.1046 23 32 23Z" fill="var(--theme--primary, var(--primary))"/>
        <path d="M44 23H40C38.8954 23 38 23.8954 38 25V29C38 30.1046 38.8954 31 40 31H44C45.1046 31 46 30.1046 46 29V25C46 23.8954 45.1046 23 44 23Z" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <path d="M56 23H52C50.8954 23 50 23.8954 50 25V29C50 30.1046 50.8954 31 52 31H56C57.1046 31 58 30.1046 58 29V25C58 23.8954 57.1046 23 56 23Z" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <path d="M68 23H64C62.8954 23 62 23.8954 62 25V29C62 30.1046 62.8954 31 64 31H68C69.1046 31 70 30.1046 70 29V25C70 23.8954 69.1046 23 68 23Z" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <path d="M80 23H76C74.8954 23 74 23.8954 74 25V29C74 30.1046 74.8954 31 76 31H80C81.1046 31 82 30.1046 82 29V25C82 23.8954 81.1046 23 80 23Z" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <path d="M92 23H88C86.8954 23 86 23.8954 86 25V29C86 30.1046 86.8954 31 88 31H92C93.1046 31 94 30.1046 94 29V25C94 23.8954 93.1046 23 92 23Z" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <rect x="60" y="37" width="60" height="4" rx="1" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <rect x="27" y="47" width="102" height="16" rx="5" stroke="var(--theme--primary, var(--primary))" stroke-width="2"/>
        <path d="M42 53H34V54.3437H42V53ZM34 57H42V55.6563H34V57Z" fill="var(--theme--primary, var(--primary))"/>
        <path d="M121.104 58.1042H114.896V51.8958H118V51H114.896C114.396 51 114 51.3958 114 51.8958V58.1042C114 58.6042 114.396 59 114.896 59H121.104C121.604 59 122 58.6042 122 58.1042V55H121.104V58.1042ZM118.896 51V51.8958H120.479L116.125 56.25L116.75 56.875L121.104 52.5208V54.1042H122V51H118.896Z" fill="var(--theme--primary, var(--primary))"/>
        <rect x="48" y="53" width="30" height="4" rx="1" fill="var(--theme--primary, var(--primary))"/>
        <rect x="82" y="53" width="10" height="4" rx="1" fill="var(--theme--primary, var(--primary))"/>
        <rect x="26" y="69" width="60" height="4" rx="1" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
        <rect x="26" y="37" width="30" height="4" rx="1" fill="var(--theme--primary, var(--primary))" fill-opacity="0.25"/>
    </svg>`,
    options: [
        {
            field: "placeholder",
            name: "$t:placeholder",
            meta: {
                interface: "system-input-translated-string",
                options: {
                    placeholder: "$t:enter_a_placeholder",
                },
            },
        },
        {
            field: "readonly",
            name: "Read Only",
            type: "boolean",
            meta: {
                width: "half",
                interface: "boolean",
                options: {
                    label: "Make editor read-only",
                },
            },
            schema: {
                default_value: false,
            },
        },
        {
            field: "settings",
            name: "Editor Settings",
            type: "json",
            meta: {
                width: "full",
                interface: "input-code",
                options: {
                    language: "json",
                    placeholder: `{
  "editorKey": "default",
  "locale": "zh-CN",
  "theme": "light",
  "height": "400px",
  "document": {
    "placeholder": "Please enter your content..."
  }
}`,
                    template: JSON.stringify({
                        editorKey: "default",
                        locale: "zh-CN",
                        theme: "light",
                        height: "400px",
                        document: {
                            placeholder: "Please enter the document content..."
                        }
                    }, null, 2),
                },
            },
            schema: {
                default_value: null,
            },
        },
    ],
}); 