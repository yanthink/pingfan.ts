---
nav:
  title: MDE
  path: /markdown-editor
---

### 基本用法

<code src="../demos/index.tsx"></code>

### emoji

<code src="../demos/emoji.tsx"></code>

### API

#### Editor

<API src="./Editor.tsx" hideTitle></API>

#### previewOptions

<API src="./Preview.tsx" hideTitle></API>

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

[codemirror6 文档](https://codemirror.net/6/)
