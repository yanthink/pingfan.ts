import { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { EditorState, Extension, StateEffect } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import * as commands from '../commands';

export interface UseCodeMirrorProps {
  /**
   * @description 挂载节点
   */
  containerRef: MutableRefObject<HTMLDivElement | null>;
  /**
   * @description 编辑器内容
   */
  value?: string;
  /**
   * @description 高度
   */
  height?: number | string;
  /**
   * @description 最小高度
   */
  minHeight?: number | string;
  /**
   * @description 最大高度
   */
  maxHeight?: number | string;
  /**
   * @description [codemirror 扩展](https://codemirror.net/6/)
   */
  extensions?: Extension[];

  /**
   * @description 内容变化时的回调
   */
  onChange?(value: string, viewUpdate: ViewUpdate): void;

  /**
   * @description 状态更新时的回调
   */
  onUpdate?(viewUpdate: ViewUpdate): void;
}

function strSuffix(str: number | string, suffix: string = 'px'): string {
  return str ? String(str).replace(new RegExp(`(${suffix})?\s*$`, 'i'), suffix) : '';
}

export default (props: UseCodeMirrorProps) => {
  const {
    containerRef,
    value,
    height = '',
    minHeight = '',
    maxHeight = '',
    onChange,
    onUpdate,
  } = props;

  const editorViewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef<UseCodeMirrorProps['onChange']>();
  const onUpdateRef = useRef<UseCodeMirrorProps['onUpdate']>();
  onChangeRef.current = onChange;
  onUpdateRef.current = onUpdate;

  const extensions = useMemo(() => {
    return (props.extensions || []).concat([
      keymap.of([
        { key: 'Tab', run: commands.indent, shift: commands.indentLess },
        { key: 'Mod-b', run: commands.bold },
        { key: 'Mod-i', run: commands.italic },
        { key: 'Mod-h', run: commands.heading },
        { key: 'Mod-Alt-i', run: commands.image },
        { key: 'Mod-\'', run: commands.quote },
        { key: 'Mod-Alt-c', run: commands.code },
        { key: 'Mod-l', run: commands.unorderedList },
        { key: 'Mod-Alt-l', run: commands.orderedList },
      ]),
      markdown({ codeLanguages: languages, base: markdownLanguage }),
      EditorView.theme({
        '&': { height: strSuffix(height) },
        ...(height ? { '.cm-scroller': { overflow: 'auto' } } : {}),
        '.cm-content, .cm-gutter': { minHeight: strSuffix(minHeight), maxHeight: strSuffix(maxHeight) },
      }),
      EditorView.updateListener.of((viewUpdate) => {
        if (viewUpdate.docChanged) {
          const value = viewUpdate.state.doc.toString();
          onChangeRef.current?.(value, viewUpdate);
        }
        onUpdateRef.current?.(viewUpdate);
      }),
      // todo placeholder 会导致起始位置无法输入中文
    ]);
  }, [height, minHeight, minHeight, props.extensions]);

  // reconfigure
  useEffect(() => {
    // todo 样式会一直累加
    editorViewRef.current?.dispatch({ effects: StateEffect.reconfigure.of(extensions) });
  }, [extensions]);

  // value change
  useEffect(() => {
    const currentValue = editorViewRef.current?.state.doc.toString();
    if (value !== currentValue) {
      editorViewRef.current?.dispatch({
        changes: { from: 0, to: currentValue?.length, insert: value },
      });
    }
  }, [value]);

  // 编辑器初始化
  useEffect(() => {
    // todo 第一次 setState containerRef.current 值会变
    if (containerRef.current) {
      const state = EditorState.create({ doc: value, extensions });
      editorViewRef.current = new EditorView({ state, parent: containerRef.current });

      return () => {
        editorViewRef.current?.destroy();
      };
    }
  }, []);

  return editorViewRef;
};
