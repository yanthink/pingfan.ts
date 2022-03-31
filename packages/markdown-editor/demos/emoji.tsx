import React, { useMemo, useRef, useState } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import Editor, { EditorInstance } from '@pingfan.ts/markdown-editor';
import upload from '@pingfan.ts/markdown-editor/es/plugins/upload';
import scrollSync from '@pingfan.ts/markdown-editor/es/plugins/scroll-sync';
import type { ToolbarButton } from '@pingfan.ts/markdown-editor/es/Toolbar';
import SmileOutlined from '@ant-design/icons/SmileOutlined';
import remarkEmoji from '@pingfan.ts/remark-emoji';
import RcTrigger from 'rc-trigger';
import EmojiPicker from '@pingfan.ts/emoji-picker';
import emojiToolkit from 'emoji-toolkit';
import 'rc-trigger/assets/index.css';
import 'emoji-assets/sprites/joypixels-sprite-32.min.css'; // 需要安装 emoji-asset@^6.6.0
import './emoji.css';

// 全局设置
emojiToolkit.sprites = true; // sprites = true 需要安装 emoji-asset@^6.6.0 依赖并引入 emoji-asset 对应的 css 样式
emojiToolkit.spriteSize = '32';

const placements = {
  left: {
    points: ['cr', 'cl'],
  },
  right: {
    points: ['cl', 'cr'],
  },
  top: {
    points: ['bc', 'tc'],
  },
  bottom: {
    points: ['tc', 'bc'],
  },
  topLeft: {
    points: ['bl', 'tl'],
  },
  topRight: {
    points: ['br', 'tr'],
  },
  bottomRight: {
    points: ['tr', 'br'],
  },
  bottomLeft: {
    points: ['tl', 'bl'],
  },
};

export default () => {
  const editorRef = useRef<EditorInstance>(null);
  const [value, setValue] = useState('');

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

  const emojiButton: ToolbarButton = {
    type: 'custom',
    render: () => (
      <RcTrigger
        action={['click']}
        popupAlign={{
          offset: [0, 12],
        }}
        popupPlacement="bottom"
        builtinPlacements={placements}
        popup={
          <EmojiPicker
            // sprites = true 需要引入 emoji-asset 对应的 css 样式
            emojiToolkit={{ sprites: true, spriteSize: '32' }}
            onSelect={(emoji) => {
              const editorView = editorRef.current?.getEditorView();
              if (editorView) {
                const { state, dispatch } = editorView;
                if (state.readOnly) return false;
                // dispatch(state.replaceSelection(emoji.shortname));
                dispatch(state.replaceSelection(emojiToolkit.shortnameToUnicode(emoji.shortname)));
              }
            }}
            // 启用搜索，搜索规则是 匹配 shortname、shortname_alternates、ascii 和 keywords 字段
            search
          />
        }
      >
        <SmileOutlined className="pf-mde-button" />
      </RcTrigger>
    ),
  };

  return (
    <Editor
      ref={editorRef}
      value={value}
      onChange={setValue}
      extensions={extensions}
      toolbar={{
        buttons: [
          'bold',
          'italic',
          'strikethrough',
          'heading',
          '|',
          'quote',
          'code',
          'table',
          'line',
          'unorderedList',
          'orderedList',
          '|',
          'link',
          'image',
          '|',
          'preview',
          'editorPreview',
          'fullScreen',
          '|',
          emojiButton,
        ],
      }}
      previewOptions={{
        remarkPlugins: [remarkEmoji],
      }}
    />
  );
};
