import { markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxTree, indentUnit } from '@codemirror/language';
import { EditorSelection } from '@codemirror/state';
import { snippet } from '@codemirror/autocomplete';
import type { SyntaxNode } from '@lezer/common';
import type { Command, EditorView } from '@codemirror/view';
import type { Text } from '@codemirror/text';
import type { ChangeSpec, SelectionRange } from '@codemirror/state';

function isMultipleLines(doc: Text, from: number, to: number) {
  return doc.lineAt(from).to < to;
}

function toggleInline(view: EditorView, nodeName: string, markString: string) {
  const { state, dispatch } = view;
  if (state.readOnly) return false;

  const tree = syntaxTree(state);
  let dont = null;

  const changes = state.changeByRange((range) => {
    if (isMultipleLines(state.doc, range.from, range.to)) return (dont = { range });
    if (!markdownLanguage.isActiveAt(state, range.from)) return (dont = { range });

    let node: SyntaxNode | null = tree.resolveInner(range.from);
    if (['URL', 'Image', 'Link', 'LinkMark', 'LinkTitle'].includes(node.name))
      return (dont = { range });
    if (!range.empty && ['Document', 'Paragraph'].includes(node.name))
      node = tree.resolveInner(range.from, 1);

    while (![nodeName, 'Paragraph'].includes(node.name) && node.parent) {
      node = node.parent;
    }

    if (node.name === nodeName && node.to >= range.to) {
      const startMarkNode = node.firstChild!;
      const endMarkNode = node.lastChild!;

      const anchor =
        Math.min(Math.max(range.anchor, startMarkNode.to), endMarkNode.from) -
        startMarkNode.to +
        startMarkNode.from;
      const head =
        Math.min(Math.max(range.head, startMarkNode.to), endMarkNode.from) -
        startMarkNode.to +
        startMarkNode.from;

      return {
        changes: [
          { from: startMarkNode.from, to: startMarkNode.to },
          { from: endMarkNode.from, to: endMarkNode.to },
        ],
        range: EditorSelection.range(anchor, head),
      };
    }

    node = getCodeNode(view, range.from);
    if (node?.name === 'CodeBlock' || node?.name === 'FencedCode') return (dont = { range });

    const fromNode = tree.resolveInner(range.from);
    const toNode = tree.resolveInner(range.to);

    if (fromNode !== toNode) {
      if (
        [fromNode.name, toNode.name].some(
          (name) =>
            ![
              'Document',
              'Paragraph',
              'Blockquote',
              'BulletList',
              'OrderedList',
              'ListItem',
              'ATXHeading1',
              'ATXHeading2',
              'ATXHeading3',
              'ATXHeading4',
              'ATXHeading5',
              'ATXHeading6',
              'SetextHeading1',
              'SetextHeading2',
            ].includes(name),
        )
      ) {
        return (dont = { range });
      }
    }

    return {
      changes: [
        { from: range.from, insert: markString },
        { from: range.to, insert: markString },
      ],
      range: EditorSelection.range(
        range.anchor + markString.length,
        range.head + markString.length,
      ),
    };
  });

  if (changes.changes.empty) return false;

  dispatch(state.update(changes, { userEvent: `toggle.${nodeName}` }));

  return !dont;
}

function toggleHeading(view: EditorView, level?: number) {
  const { state, dispatch } = view;
  if (state.readOnly) return false;

  const tree = syntaxTree(state);

  const changes = state.changeByRange((range) => {
    const changes: ChangeSpec[] = [];

    for (let pos = range.from; pos <= range.to; ) {
      const line = state.doc.lineAt(pos);

      do {
        if (!markdownLanguage.isActiveAt(state, pos)) break;

        let node: SyntaxNode | null = tree.resolveInner(line.to, -1);
        while (node && !node.name.startsWith('ATXHeading')) {
          node = node.parent;
        }
        node = node?.firstChild || null;

        if (node?.name === 'HeaderMark') {
          const toLevel = level || (node.to - node.from + 1) % 7;
          changes.push(
            { from: line.from, to: node.to, insert: `${'#'.repeat(toLevel)}${toLevel ? ' ' : ''}` },
            { from: node.to, to: line.to, insert: state.sliceDoc(node.to, line.to).trimStart() },
          );
        } else {
          node = getCodeNode(view, line.to, true);
          if (node?.name === 'CodeBlock' || node?.name === 'FencedCode') break;

          const toLevel = level || 1;
          changes.push({
            from: line.from,
            to: line.to,
            insert: `${'#'.repeat(toLevel)} ${line.text.trimStart()}`,
          });
        }
      } while (false);

      pos = line.to + 1;
    }

    const changeSet = state.changes(changes);

    return {
      changes,
      range: EditorSelection.range(
        changeSet.mapPos(range.anchor, 1),
        changeSet.mapPos(range.head, 1),
      ),
    };
  });

  if (changes.changes.empty) return false;

  dispatch(state.update(changes, { userEvent: `toggle.heading` }));

  return true;
}

function toggleBlock(view: EditorView, type: 'quote' | 'unorderedList' | 'orderedList') {
  const { state, dispatch } = view;
  if (state.readOnly) return false;

  const regExp = {
    quote: /^(\s*)>\s+/,
    unorderedList: /^(\s*)([*-+])\s+/,
    orderedList: /^(\s*)\d+\.\s+/,
  }[type];

  const changes = state.changeByRange((range) => {
    let changes: ChangeSpec[] = [];

    const exist = regExp.test(state.doc.lineAt(range.from).text);

    for (let pos = range.from, i = 1; pos <= range.to; ) {
      const line = state.doc.lineAt(pos);

      if (getCodeNode(view, line.to, true)?.name === 'FencedCode') {
        changes = [];
        break;
      }

      const mark = { quote: '> ', unorderedList: '* ', orderedList: `${i}. ` }[type];
      const text = exist ? line.text.replace(regExp, '$1') : `${mark}${line.text}`;

      changes.push({ from: line.from, to: line.to, insert: text });

      i++;
      pos = line.to + 1;
    }

    const changeSet = state.changes(changes);

    return {
      changes,
      range: EditorSelection.range(
        changeSet.mapPos(range.anchor, 1),
        changeSet.mapPos(range.head, 1),
      ),
    };
  });

  if (changes.changes.empty) return false;

  dispatch(state.update(changes, { userEvent: `toggle.heading` }));

  return true;
}

export function getCodeNode(view: EditorView, pos: number, lineEndPos = false): SyntaxNode | null {
  const { state } = view;
  const tree = syntaxTree(state);
  let node: SyntaxNode | null = tree.resolve(pos, lineEndPos ? -1 : 0);

  do {
    if (
      (node.name === 'InlineCode' && !lineEndPos) ||
      ['CodeBlock', 'FencedCode'].includes(node.name)
    ) {
      return node;
    }
  } while ((node = node.parent));

  if (!lineEndPos) {
    const line = state.doc.lineAt(pos);
    if (pos !== line.to - 1) {
      return getCodeNode(view, line.to, true);
    }
  }

  return null;
}

function insertTemplate(view: EditorView, template: string) {
  const { state } = view;
  if (state.readOnly || state.selection.ranges.length > 1) return false;

  const [range] = state.selection.ranges;
  if (!markdownLanguage.isActiveAt(state, range.from)) return false;

  if (
    [...new Set([range.from, range.to])].some((pos) => {
      const node = getCodeNode(view, pos);
      if (node?.name === 'CodeBlock' || node?.name === 'FencedCode') {
        return pos >= node.from && pos <= node.to;
      }
    })
  ) {
    return false;
  }

  const fn = snippet(template);
  fn(view, null as any, range.from, range.to);
  return true;
}

function newLineAndReplaceSelection(view: EditorView, text: string = '') {
  const { state, dispatch } = view;

  const changes = state.changeByRange((range) => {
    if (
      [...new Set([range.from, range.to])].some((pos) => {
        const node = getCodeNode(view, pos);
        if (node?.name === 'CodeBlock' || node?.name === 'FencedCode') {
          return pos > node.from && pos < node.to;
        }

        return false;
      })
    ) {
      return { range };
    }

    const changes: ChangeSpec[] = [];

    let replacement = text;

    const fromLine = state.doc.lineAt(range.from);
    const toLine = state.doc.lineAt(range.to);

    if (range.from > fromLine.from && !/^\s*$/.test(state.sliceDoc(fromLine.from, range.from))) {
      replacement = '\n\n' + replacement;
    } else if (fromLine.number > 1) {
      const line = state.doc.line(fromLine.number - 1);
      if (!/^\s*$/.test(line.text)) {
        replacement = '\n' + replacement;
      }
    }

    const selection = EditorSelection.cursor(range.from + replacement.length + 2);

    if (!/^\s*$/.test(state.sliceDoc(range.to, toLine.to))) {
      replacement += '\n\n';
    } else if (toLine.number === state.doc.lines) {
      replacement += '\n\n';
    } else {
      const line = state.doc.line(toLine.number + 1);
      if (/^\s*$/.test(line.text)) {
        replacement += '\n';
      } else {
        replacement += '\n\n';
      }
    }

    changes.push({ from: range.from, to: range.to, insert: replacement });

    return {
      changes,
      range: selection,
    };
  });

  if (changes.changes.empty) return false;

  dispatch(state.update(changes, { userEvent: `toggle.heading` }));

  return true;
}

export const bold: Command = (view) => toggleInline(view, 'StrongEmphasis', '**');
export const italic: Command = (view) => toggleInline(view, 'Emphasis', '_');
export const strikethrough: Command = (view) => toggleInline(view, 'Strikethrough', '~~');

export const heading: Command = (view) => toggleHeading(view);
export const heading1: Command = (view) => toggleHeading(view, 1);
export const heading2: Command = (view) => toggleHeading(view, 2);
export const heading3: Command = (view) => toggleHeading(view, 3);
export const heading4: Command = (view) => toggleHeading(view, 4);
export const heading5: Command = (view) => toggleHeading(view, 5);
export const heading6: Command = (view) => toggleHeading(view, 6);

export const code: Command = (view) => {
  const { state, dispatch } = view;
  if (state.readOnly) return false;

  if (state.selection.ranges.length > 1) {
    return toggleInline(view, 'InlineCode', '`');
  }

  const range = state.selection.main;
  const node = getCodeNode(view, range.from);

  const line = state.doc.lineAt(range.from);
  const selMulti = isMultipleLines(state.doc, range.from, range.to);
  const noSelAndStartingOfLine = range.empty && range.from === line.from;

  const changes: ChangeSpec[] = [];
  let selection: SelectionRange | undefined = undefined;

  if (!selMulti && (node?.name === 'InlineCode' || (!node && !noSelAndStartingOfLine))) {
    return toggleInline(view, 'InlineCode', '`');
  }

  if (node?.name === 'CodeBlock') {
    for (let pos = node.from; pos <= node.to; ) {
      const line = state.doc.lineAt(pos);
      const space = /^\s*/.exec(line.text)![0];
      if (space) {
        let tabFlag = false;
        for (let j = 0; j < space.length; j++) {
          if (space.charCodeAt(j) === 9) {
            // \t
            tabFlag = true;
            changes.push({ from: line.from + j, to: line.from + j + 1 });
            break;
          }
        }
        if (!tabFlag) {
          changes.push({ from: line.from, to: line.from + 4 });
        }
      }

      pos = line.to + 1;
    }
  } else if (node?.name === 'FencedCode') {
    if (node.to < range.to) return false;

    changes.push(
      { from: node.from, to: state.doc.lineAt(node.from).to + 1 },
      { from: state.doc.lineAt(node.to).from - 1, to: node.to },
    );
  } else {
    if (range.to > line.to) {
      for (let pos = line.to + 1; pos <= range.to; ) {
        const line = state.doc.lineAt(pos);
        if (getCodeNode(view, pos)?.name === 'FencedCode') return false;
        pos = line.to + 1;
      }
    }

    changes.push({ from: range.from, insert: '```\n' }, { from: range.to, insert: '\n```' });
    selection = EditorSelection.range(range.anchor + 4, range.head + 4);
  }

  dispatch({
    changes,
    selection,
  });

  return true;
};

// todo 有！前缀中文输入有bug
export const image: Command = (view) => insertTemplate(view, '![${alt}](${url} "${title}") ${}');
export const link: Command = (view) => insertTemplate(view, '[${link}](${url}) ${}');

export const line: Command = (view) => newLineAndReplaceSelection(view, '-----');
export const table: Command = (view) =>
  newLineAndReplaceSelection(
    view,
    '| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text     | Text     |',
  );

export const quote: Command = (view) => toggleBlock(view, 'quote');
export const orderedList: Command = (view) => toggleBlock(view, 'orderedList');
export const unorderedList: Command = (view) => toggleBlock(view, 'unorderedList');

export const indent: Command = (view) => {
  const { state, dispatch } = view;

  const changes = state.changeByRange((range) => {
    const changes: ChangeSpec[] = [];

    if (range.from < range.to) {
      for (let pos = range.from; pos <= range.to; ) {
        const line = state.doc.lineAt(pos);
        changes.push({ from: line.from, insert: state.facet(indentUnit) });
        pos = line.to + 1;
      }
    } else {
      changes.push({ from: range.from, insert: state.facet(indentUnit) });
    }

    const changeSet = state.changes(changes);

    return {
      changes,
      range: EditorSelection.range(
        changeSet.mapPos(range.anchor, 1),
        changeSet.mapPos(range.head, 1),
      ),
    };
  });

  if (changes.changes.empty) return false;

  dispatch(state.update(changes, { userEvent: `indent` }));

  return true;
};

export { indentLess } from '@codemirror/commands';
