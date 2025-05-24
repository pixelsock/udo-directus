'use client';

import React from 'react';
import { Plate } from '@udecode/plate/react';
import { useCreateEditor } from './use-create-editor';
import { Editor, EditorContainer } from '../ui/editor';

interface PlateEditorProps {
  value?: any[];
  onChange?: (value: any[]) => void;
  placeholder?: string;
}

export function PlateEditor({ value, onChange, placeholder = 'Type...' }: PlateEditorProps) {
  const editor = useCreateEditor(value);

  // Handle changes
  React.useEffect(() => {
    if (onChange) {
      const handleChange = () => {
        onChange(editor.children);
      };
      
      // Listen for editor changes
      editor.onChange = handleChange;
    }
  }, [editor, onChange]);

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor placeholder={placeholder} />
      </EditorContainer>
    </Plate>
  );
} 