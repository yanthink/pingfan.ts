import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import classnames from 'classnames';
import useCodeMirror, { UseCodeMirrorProps } from './hooks/useCodeMirror';
import useDisplayMode from './hooks/useDisplayMode';
import useBackup from './hooks/useBackup';
import * as commands from './commands';
import Toolbar, { ToolbarInstance, ToolbarProps, BuiltInButton } from './Toolbar';
import Preview, { PreviewInstance } from './Preview';
import './Editor.less';

export interface EditorInstance {
  getContainer(): HTMLDivElement | null;

  getEditorView(): EditorView | null;

  getToolbar(): ToolbarInstance | null;

  getPreview(): PreviewInstance | null;

  getDisplayMode(): {
    fullScreen: boolean;
    preview: boolean;
    editorPreview: boolean;
  };

  toggleFullScreen(bool?: boolean): void;

  togglePreview(bool?: boolean): void;

  toggleEditorPreview(bool?: boolean): void;
}

export interface EditorProps extends Omit<UseCodeMirrorProps, 'containerRef' | 'onUpdate'> {
  /**
   * @description  工具条
   */
  toolbar?:
    | false
    | {
        buttons: ToolbarProps['buttons'];
      };
  /**
   * @description 预览选项
   */
  previewOptions?: {
    /**
     * @description  刷新间隔(ms)
     * @default 1000
     */
    interval?: number;
    /**
     * @description 自定义渲染
     */
    render?(markdown: string): React.ReactNode;
    /**
     * @description remark 插件
     */
    remarkPlugins?: import('unified').PluggableList;
    /**
     * @description rehype 插件
     */
    rehypePlugins?: import('unified').PluggableList;
  };
  /**
   * @description 自动保存，下次初始化时可恢复上一次保存的内容
   */
  storageKey?: string;
}

const Editor = forwardRef<EditorInstance, EditorProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<ToolbarInstance>(null);
  const previewRef = useRef<PreviewInstance>(null);

  const { height = '', minHeight = '', maxHeight = '' } = props;
  const { toolbar, previewOptions, storageKey, ...useCodeMirrorProps } = props;

  const editorViewRef = useCodeMirror({
    ...useCodeMirrorProps,
    containerRef,
    onUpdate(viewUpdate: ViewUpdate) {
      if (viewUpdate.docChanged) {
        if (displayModeRef.current.editorPreview) {
          const value = viewUpdate.state.doc.toString();
          previewRef.current?.debounceSetMarkdown(value);
        }
      }
    },
  });
  const [displayModeRef, toggleFullScreen, togglePreview, toggleEditorPreview] = useDisplayMode();
  const { fullScreen, preview, editorPreview } = displayModeRef.current;

  useBackup(editorViewRef, storageKey);

  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getEditorView: () => editorViewRef.current,
    getToolbar: () => toolbarRef.current,
    getPreview: () => previewRef.current,
    getDisplayMode: () => displayModeRef.current,
    toggleFullScreen,
    togglePreview,
    toggleEditorPreview,
  }));

  useEffect(() => {
    if (editorViewRef.current) {
      toolbarRef.current?.setKeymap(editorViewRef.current.state.facet(keymap).flat());
    }
  }, [editorViewRef.current]);

  // 预览
  useEffect(() => {
    if (preview || editorPreview) {
      const value = editorViewRef.current?.state.doc.toString();
      previewRef.current?.setMarkdown(value || '');
    }
  }, [preview, editorPreview]);

  // 预览、全屏、编辑预览切换
  useEffect(() => {
    toolbarRef.current?.setButtonState(displayModeRef.current);
  }, [displayModeRef.current]);

  const toolbarProps = {
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
    ] as BuiltInButton[],
    ...toolbar,
  };

  const handleToolbarButtonClick: ToolbarProps['onButtonClick'] = (type) => {
    switch (type) {
      case 'fullScreen':
        return toggleFullScreen();
      case 'preview':
        return togglePreview();
      case 'editorPreview':
        return toggleEditorPreview();
      default:
        if (preview) return;
        (commands as any)[type]?.(editorViewRef.current);
        return editorViewRef.current?.focus();
    }
  };

  return (
    <div className={classnames('pf-mde-container', { 'pf-mde-full-screen': fullScreen })}>
      {toolbar !== false && (
        <Toolbar ref={toolbarRef} {...toolbarProps} onButtonClick={handleToolbarButtonClick} />
      )}
      <div className="pf-mde-body" style={{ height, minHeight, maxHeight }}>
        <div
          ref={containerRef}
          className={classnames('pf-mde-editor-container', {
            'pf-mde-hidden': preview,
          })}
        />
        <div
          className={classnames('pf-mde-preview-container', {
            'pf-mde-editor-preview': editorPreview,
            'pf-mde-hidden': !preview && !editorPreview,
          })}
        >
          <Preview ref={previewRef} shouldUpdate={preview || editorPreview} {...previewOptions} />
        </div>
      </div>
    </div>
  );
});

export default Editor;
