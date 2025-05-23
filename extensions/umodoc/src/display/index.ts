import { defineDisplay } from "@directus/extensions-sdk";
import DisplayComponent from "./display.vue";

export default defineDisplay({
    id: "umo-editor-display",
    name: "Umo Editor Display",
    icon: "description",
    description: "Display rich document content created with Umo Editor",
    component: DisplayComponent,
    options: [
        {
            field: "format",
            name: "Display Format",
            type: "string",
            meta: {
                width: "half",
                interface: "select-dropdown",
                options: {
                    choices: [
                        {
                            text: "Rich Text (HTML)",
                            value: "html",
                        },
                        {
                            text: "Plain Text",
                            value: "text",
                        },
                        {
                            text: "Raw JSON",
                            value: "json",
                        },
                    ],
                },
            },
            schema: {
                default_value: "html",
            },
        },
        {
            field: "maxLength",
            name: "Maximum Length",
            type: "integer",
            meta: {
                width: "half",
                interface: "input",
                options: {
                    placeholder: "Leave empty for no limit",
                },
            },
            schema: {
                default_value: null,
            },
        },
    ],
    types: ["json"],
}); 