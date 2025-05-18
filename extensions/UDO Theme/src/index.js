import { defineTheme } from '@directus/extensions-sdk';

export default defineTheme({
  // UDO/Charlotte theme, schema-compliant

  // UDO/Charlotte theme based on Webflow variables and style guide

  id: 'udo-theme',
  name: 'UDO Theme',
  appearance: 'light',
  rules: {
    borderRadius: '2px',
    borderWidth: '1px',
    foreground: '#0c1c35', // midnight blue
    background: '#ffffff',
    primary: '#0b7f8c', // teal
    secondary: '#e8e8e8', // light grey
    accent: '#ec993d', // sandy brown
    black: '#000000',
    white: '#ffffff',
    dimGrey: '#707070',

    fonts: {
      display: {
        fontFamily: 'proxima-nova, Inter, Arial, sans-serif',
        fontWeight: '700',
      },
      sans: {
        fontFamily: 'proxima-nova, Inter, Arial, sans-serif',
        fontWeight: '400',
      },
      serif: {
        fontFamily: 'Georgia, Times, serif',
        fontWeight: '400',
      },
      monospace: {
        fontFamily: 'Menlo, Monaco, monospace',
        fontWeight: '400',
      },
    },

    navigation: {
      background: '#ffffff',
      borderColor: '#0c1c35',
      list: {
        foreground: '#0c1c35',
        foregroundActive: '#0b7f8c',
        backgroundActive: '#e8e8e8',
        divider: {
          borderColor: '#e8e8e8',
          borderWidth: '1px',
        },
      },
    },

    header: {
      background: '#ffffff',
      borderColor: '#0c1c35',
      title: {
        foreground: '#0c1c35',
        fontFamily: 'proxima-nova, Inter, Arial, sans-serif',
        fontWeight: '700',
      },
    },

    sidebar: {
      background: '#e8e8e8',
      foreground: '#0c1c35',
      borderColor: '#0c1c35',
      fontFamily: 'proxima-nova, Inter, Arial, sans-serif',
    },

    form: {
      columnGap: '16px',
      rowGap: '16px',
      field: {
        label: {
          foreground: '#0c1c35',
          fontFamily: 'proxima-nova, Inter, Arial, sans-serif',
          fontWeight: '500',
        },
        input: {
          background: '#ffffff',
          foreground: '#0c1c35',
          borderColor: '#0c1c35',
          borderColorFocus: '#0b7f8c',
          borderColorHover: '#ec993d',
          boxShadow: '0 1px 2px #0000000d',
          height: '2.75rem',
          padding: '0.5rem 0.75rem',
        },
      },
    },

    link: {
      color: '#0c1c35',
      textDecoration: 'underline',
      hover: {
        color: '#0b7f8c',
      },
    },

    card: {
      background: '#ffffff',
      borderRadius: '8px',
      shadow: '0 4px 8px -2px #0000001a, 0 2px 4px -2px #0000000f',
    },
  
    // Colors from Webflow :root
    background: '#ffffff',
    foreground: '#0c1c35', // --midnight-blue
    primary: '#0b7f8c',    // --teal
    secondary: '#e8e8e8',  // --light-grey
    accent: '#ec993d',     // --sandy-brown
    black: '#000000',      // --black
    white: '#ffffff',      // --white
    dimGrey: '#707070',    // --dim-grey
    // Typography
    fontFamily: 'proxima-nova, Inter, Arial, sans-serif',

    // Border radius
    borderRadius: '2px', // matches most UI elements in Webflow
    // Navigation
    navigation: {
      background: '#ffffff',
      foreground: '#0c1c35',
      active: {
        background: '#e8e8e8',
        foreground: '#0b7f8c',
      },
    },
    // Buttons
    button: {
      background: '#000000',
      foreground: '#ffffff',
      borderRadius: '2px',
      borderColor: '#000000',
      secondary: {
        background: '#ffffff',
        foreground: '#0c1c35',
        borderColor: '#0c1c35',
      },
      accent: {
        background: '#ec993d',
        foreground: '#ffffff',
      },
    },
    // Muted/Disabled
    muted: {
      foreground: '#707070', // --dim-grey
      background: '#e8e8e8', // --light-grey
    },
    // Card/Panel backgrounds
    card: {
      background: '#ffffff',
      borderRadius: '8px',
      shadow: '0 4px 8px -2px #0000001a, 0 2px 4px -2px #0000000f',
    },
    // Link styles
    link: {
      color: '#0c1c35',
      textDecoration: 'underline',
      hover: {
        color: '#0b7f8c',
      },
    },
    // Logo (if Directus supports logo override)
    // logo: '/assets/udo-logo.svg',

    background: '#ffffff',
    foreground: '#222a35',
    primary: '#005596',
    secondary: '#c9e6ff',
    accent: '#e87722',
    borderRadius: '8px',
    fontFamily: 'Inter, Arial, sans-serif',
    navigation: {
      background: '#005596',
      foreground: '#ffffff',
      active: {
        background: '#e87722',
        foreground: '#ffffff',
      },
    },
    muted: {
      foreground: '#6c757d',
    },
    // Add more overrides as needed
  },
});