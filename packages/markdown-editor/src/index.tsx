/// <reference path="typings.d.ts" /> // 解决 father-build 是无法找到 typings 的问题
import Editor from './Editor';

export type { EditorInstance, EditorProps } from './Editor';
export type { ToolbarInstance, ToolbarProps, ToolbarButton } from './Toolbar';
export type { PreviewInstance, PreviewProps } from './Preview';
export default Editor;
