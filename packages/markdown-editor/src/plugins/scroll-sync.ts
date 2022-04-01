import { MutableRefObject } from 'react';
import { EditorView } from '@codemirror/basic-setup';
import debounce from 'lodash/debounce';
import { Line } from '@codemirror/text';
// @ts-ignore
import smoothscroll from 'smoothscroll-polyfill';
import { getCodeNode } from '../commands';
import { EditorInstance } from '../Editor';

smoothscroll.polyfill();

function getNonBlankLine(view: EditorView, line: Line) {
  const { state } = view;

  const codeNode = getCodeNode(view, line.from);
  if (codeNode?.name === 'CodeBlock' || codeNode?.name === 'FencedCode') {
    return line;
  }

  let newLine = line;

  while (/^\s*$/.test(newLine.text)) {
    if (newLine.to >= state.doc.length) {
      break;
    }
    newLine = state.doc.lineAt(newLine.to + 1);
  }

  while (/^\s*$/.test(newLine.text)) {
    if (Math.min(line.from, newLine.from) <= 0) {
      break;
    }
    newLine = state.doc.lineAt(Math.min(line.from, newLine.from) - 1);
  }

  return newLine;
}

function getOffsetTop(el: HTMLElement, parentEl: Element) {
  let offsetTop = el.offsetTop;

  let pEL = el.offsetParent as HTMLElement;

  let i = 0;
  while (pEL && pEL !== parentEl) {
    offsetTop += pEL.offsetTop;
    pEL = pEL.offsetParent as HTMLElement;
    if (++i >= 100) break;
  }

  return offsetTop;
}

export default (editorRef: MutableRefObject<EditorInstance | null>, previewInterval = 1000) => {
  let lastCursorLineNumber = -1;
  let lockScrollEvent = false;
  let lastScrollLineNumber = -1;

  function scrollToLine(children: any[], line: Line, marginTop = 0, el?: Element): void {
    const view = editorRef.current!.getEditorView()!;
    const preview = editorRef.current!.getPreview()!;
    const { state } = view;

    const previewDOM = preview.getContainer();

    if (!previewDOM) return;

    let scrollTop = 0;
    let offsetTop = 0;
    let index = -1;

    for (let i = 0; i < children.length; i++) {
      const node = children[i];

      if (node.type === 'element') index++;

      const from = node.position?.start?.offset;
      let to = node.position?.end?.offset;

      if (isNaN(to)) {
        for (let j = i + 1; j < children.length; j++) {
          to = children[j].position?.start?.offset;
        }
      }

      if (isNaN(from) || isNaN(to)) continue;

      if ((from <= line.from && to >= line.to) || (line.from <= from && line.to >= to)) {
        if (index > -1) {
          el = el?.children[index] || previewDOM!.children[index] || el;
        }

        if (!el) return;

        const elStyle = window.getComputedStyle(el);
        let lineHeight = parseInt(elStyle.lineHeight);

        switch (node.tagName) {
          case 'p':
            const text = state.sliceDoc(from, line.from);
            const lineNumber = text.match(/\r?\n|<br\s*\/>/gi)?.length || 0;

            if (lineNumber > 0) {
              let i = 0;
              let _lineHeight = lineHeight;
              for (const node of el.children) {
                if (node.tagName.toLowerCase() !== 'br') {
                  const nodeStyle = window.getComputedStyle(node);
                  const marginTop = parseFloat(nodeStyle.marginTop);
                  const marginBottom = parseFloat(nodeStyle.marginBottom);
                  _lineHeight = Math.max(node.clientHeight + marginTop + marginBottom, lineHeight);
                  continue;
                }
                // offsetTop += _lineHeight;
                offsetTop =
                  node.getBoundingClientRect().top - el.getBoundingClientRect().top + _lineHeight;
                _lineHeight = lineHeight;
                if (++i >= lineNumber) {
                  break;
                }
              }
              // el = [...el.children].filter(node => node.tagName.toLowerCase() === 'br')[lineNumber - 1] || el;
            }

            // el?.scrollIntoView({ behavior: 'smooth' });
            break;
          case 'pre':
            const codeNode = getCodeNode(view, line.from);

            if (codeNode?.name === 'CodeBlock' || codeNode?.name === 'FencedCode') {
              let lineNumber = line.number - state.doc.lineAt(codeNode.from).number;
              let totalLineNumber =
                state.doc.lineAt(codeNode.to).number - state.doc.lineAt(codeNode.from).number + 1;
              if (codeNode?.name === 'FencedCode') {
                lineNumber--;
                totalLineNumber -= 2;
              }

              if (lineNumber > 0) {
                const codeEl = el.children[0];
                let paddingTop = 0;
                let paddingBottom = 0;
                if (codeEl) {
                  const codeElStyle = window.getComputedStyle(codeEl);
                  paddingTop = parseInt(codeElStyle.paddingTop);
                  paddingBottom = parseInt(codeElStyle.paddingBottom);
                  const codeContentHeight = codeEl.clientHeight - paddingTop - paddingBottom;
                  lineHeight = codeContentHeight / totalLineNumber;
                }

                offsetTop = paddingTop + lineNumber * lineHeight;
              }
            }
            break;
          default:
            return scrollToLine(node.children || [], line, marginTop, el);
        }

        break;
      }
    }

    if (el) {
      scrollTop = getOffsetTop(el as HTMLElement, previewDOM);
    }

    previewDOM.scrollTo({ top: scrollTop + offsetTop + marginTop, behavior: 'smooth' });
    // previewDOM.scrollTop = scrollTop + offsetTop + marginTop;
    lastScrollLineNumber = line.number;
  }

  function handleScrollToSelection() {
    const view = editorRef.current?.getEditorView();
    const preview = editorRef.current?.getPreview();

    if (!view || !preview) return;

    const { state } = view;

    const value = state.doc.toString();
    if (value !== preview.getMarkdown()) return;

    const hast = preview.getHast();
    const line = getNonBlankLine(view, state.doc.lineAt(state.selection.main.head));
    // todo 换行的可能不太精准
    const marginTop = /^\s*$/.test(state.sliceDoc(line.to))
      ? 0
      : view.scrollDOM.scrollTop - view.lineBlockAt(line.from).top;

    if (lastScrollLineNumber !== line.number) {
      scrollToLine(hast.children, line, marginTop);
    }
  }

  const handleDebounceScrollToSelection = debounce(handleScrollToSelection, previewInterval + 300);

  const handleDebounceScroll = debounce(() => {
    const view = editorRef.current?.getEditorView();
    const preview = editorRef.current?.getPreview();

    if (!view || !preview) return;

    const { state } = view;

    const value = view.state.doc.toString();
    if (value !== preview.getMarkdown()) return;

    const hast = preview.getHast();
    // 可见区域第一行
    const blockInfo = view.lineBlockAtHeight(view.scrollDOM.scrollTop);
    const visibleFirstLine = state.doc.lineAt(blockInfo.from);
    const line = getNonBlankLine(view, visibleFirstLine);

    if (lastScrollLineNumber !== line.number) {
      const marginTop = /^\s*$/.test(visibleFirstLine.text) ? 0 : view.scrollDOM.scrollTop - blockInfo.top;
      scrollToLine(hast.children, line, marginTop);
      lastScrollLineNumber = -1; // 让每次滚动事件都执行
    }
  }, 300);

  return [
    EditorView.updateListener.of((viewUpdate) => {
      if (viewUpdate.selectionSet && editorRef.current?.getDisplayMode().editorPreview) {
        const { state } = viewUpdate;
        const cursorLineNumber = state.doc.lineAt(state.selection.main.head).number;
        lockScrollEvent = viewUpdate.docChanged && cursorLineNumber !== lastCursorLineNumber;
        lastCursorLineNumber = cursorLineNumber;

        handleDebounceScroll.cancel();

        if (viewUpdate.docChanged) {
          handleDebounceScrollToSelection();
        } else {
          handleDebounceScrollToSelection.cancel();
          handleScrollToSelection();
        }
      }
    }),
    EditorView.domEventHandlers({
      scroll() {
        if (!lockScrollEvent && editorRef.current?.getDisplayMode().editorPreview) {
          handleDebounceScrollToSelection.cancel();
          handleDebounceScroll();
        }

        lockScrollEvent = false;
      },
    }),
  ];
};
