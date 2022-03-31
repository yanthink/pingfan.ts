## React Markdown Editor

基于 [codemirror6](https://codemirror.net/6/) 的 markdown 编辑器

### 特性

- [X] 支持编辑预览同步滚动（滚动时顶部绝对对齐预览内容），支持光标改变时滚动到光标位置（行对齐）
- [X] 支持粘贴和拖拽上传图片，可显示上传进度
- [X] 支持 [emoji](https://yanthink.github.io/pingfan.ts/#/markdown-editor#emoji) 表情
- [X] 插入链接和图片支持快速修改`url`、`alt`、`title`等变量属性（tab 键可跳到下一变量，esc 退出修改）
- [X] 预览采用 [react-markdown](https://github.com/remarkjs/react-markdown) 解析，支持[语法高亮](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [X] 支持自定义预览渲染
- [X] 支持[codemirror 扩展](https://codemirror.net/6/)

![截图](https://yanthink.github.io/pingfan.ts/images/markdown-editor.png)

[使用文档](https://yanthink.github.io/pingfan.ts/#/markdown-editor)

### 安装

    npm install -S @pingfan.ts/markdown-editor

### 使用

```tsx
import React, { useMemo, useRef, useState } from 'react';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import Editor, { EditorInstance } from '@pingfan.ts/markdown-editor';
import upload from '@pingfan.ts/markdown-editor/es/plugins/upload';
import scrollSync from '@pingfan.ts/markdown-editor/es/plugins/scroll-sync';
import markdown from './markdown.txt';
import './index.css';

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
      value={value}
      onChange={setValue}
      extensions={extensions}
      storageKey="articles-create"
    />
  );
};
```

### API

#### Editor

| 属性名 | 描述 | 类型 | 默认值	|
| --- | --- | --- | --- |
| toolbar | 工具条 | <code>false &#124; { buttons: ToolbarButton[]; }</code> | -- |
| previewOptions | 预览选项 | `{ interval?: number; render?(markdown: string): ReactNode; remarkPlugins?: PluggableList; rehypePlugins?: PluggableList; }` | -- |
| storageKey | 自动保存，下次初始化时可恢复上一次保存的内容 | `string` | -- |
| value | 编辑器内容 | `string` | -- |
| height | 高度 | `string` | -- |
| minHeight | 最小高度 | `string` | -- |
| maxHeight | 最大高度 | `string` | -- |
| extensions | [codemirror 扩展](https://codemirror.net/6/) | `Extension[]` | -- |
| onChange | 内容变化时的回调 | `(value: string) => void` | -- |
| ref | -- | `Ref<EditorInstance>` | -- |

#### EditorInstance

| 名称 | 说明 | 类型 |
| --- | --- | --- |
| getContainer | 获取编辑器容器DOM | <code>() => HTMLDivElement &#124; null<code> |
| getEditorView | 获取 codemirror 实例 | <code>() => EditorView &#124; null</code> |
| getToolbar | 获取 Toolbar 实例 | <code>() => ToolbarInstance &#124; null</code> |
| getPreview | 获取 Preview 实例 | <code>() => PreviewInstance &#124; null</code> |
| getDisplayMode | 获取显示模式 | `() => { fullScreen: boolean; preview: boolean; editorPreview: boolean; }` |
| toggleFullScreen | 全屏切换 | `() => void` |
| togglePreview | 预览切换 | `() => void` |
| toggleEditorPreview | 编辑预览切换 | `() => void` |

#### PreviewInstance

| 名称 | 说明 | 类型 |
| --- | --- | --- |
| getMarkdown | 获取 markdown 内容 | `() => string` |
| setMarkdown | 设置 markdown 内容 | `(markdown: string) => void` |
| debounceSetMarkdown | 消抖设置 markdown 内容 | `(markdown: string) => void` |
| getContainer | 获取预览容器DOM | <code>() => HTMLDivElement &#124; null</code> |
| getHast | 获取hast | () => Hast | 


