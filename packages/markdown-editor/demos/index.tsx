import React, { useMemo, useRef, useState } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import Editor, { EditorInstance } from '@pingfan.ts/markdown-editor';
import upload from '@pingfan.ts/markdown-editor/es/plugins/upload';
import scrollSync from '@pingfan.ts/markdown-editor/es/plugins/scroll-sync';
import markdown from './markdown.txt';

export default () => {
  const editorRef = useRef<EditorInstance | null>(null);
  const [value, setValue] = useState<string>(markdown);

  const extensions = useMemo(
    () => [
      basicSetup,
      EditorView.lineWrapping,
      upload({
        url: 'api/attachments/upload',
        allowedTypes: 'image/*',
        transform(res: any) {
          return { url: res.data.url };
        },
      }),
      scrollSync(editorRef),
    ],
    [],
  );

  return (
    <Editor
      ref={editorRef}
      height={300}
      value={value}
      onChange={setValue}
      extensions={extensions}
      storageKey="articles-create"
    />
  );
};
