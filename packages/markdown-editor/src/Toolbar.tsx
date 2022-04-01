import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import classnames from 'classnames';
import type { KeyBinding } from '@codemirror/view';
import UndoSvg from './svg/undo';
import RedoSvg from './svg/redo';
import BoldSvg from './svg/bold';
import ItalicSvg from './svg/italic';
import StrikethroughSvg from './svg/strikethrough';
import NumberSvg from './svg/number';
import QuoteSvg from './svg/quote';
import CodeSvg from './svg/code';
import TableSvg from './svg/table';
import LineSvg from './svg/line';
import UnorderedListSvg from './svg/unordered-list';
import OrderedListSvg from './svg/ordered-list';
import LinkSvg from './svg/link';
import PictureSvg from './svg/picture';
import EyeSvg from './svg/eye';
import SplitCellsSvg from './svg/split-cells';
import FullscreenSvg from './svg/fullscreen';
import * as commands from './commands';
import './Toolbar.less';

export interface ToolbarInstance {
  setButtonState(buttonState: ButtonState): void;

  setKeymap(keymap: KeyBinding[]): void;

  extraCommandKeys(commandKeys: Record<string, string>): void;
}

export type BuiltInButton =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'heading'
  | 'quote'
  | 'code'
  | 'table'
  | 'line'
  | 'unorderedList'
  | 'orderedList'
  | 'link'
  | 'image'
  | 'preview'
  | 'editorPreview'
  | 'fullScreen';

export type ButtonState = { [type in BuiltInButton]?: boolean };

export type ToolbarButton =
  | BuiltInButton
  | '|'
  | {
  type: BuiltInButton | '|' | 'custom';
  render?: () => React.ReactNode;
};

export interface ToolbarProps {
  /**
   * @description 工具条菜单按钮
   */
  buttons: ToolbarButton[];
  /**
   * @description 菜单按钮点击事件回调
   */
  onButtonClick?: (type: BuiltInButton) => void;
}

const isMac = navigator.userAgent.indexOf('Mac') > -1;

function fixKey(key: string): string {
  return key
    .replace(/Mod/i, isMac ? 'Cmd' : 'Ctrl')
    .toLowerCase()
    .replace(/(-|^)[a-z]/g, (s) => s.toUpperCase());
}

const Toolbar = forwardRef<ToolbarInstance, ToolbarProps>(({ buttons, onButtonClick }, ref) => {
  const extraCommandKeys = useRef<Record<string, string>>({});
  const [buttonState, setButtonState] = useState<ButtonState>({});
  const [commandKeys, setCommandKeys] = useState<Record<string, string>>(extraCommandKeys.current);

  useImperativeHandle(
    ref,
    () => ({
      setButtonState(state) {
        if (
          Object.entries(state).some(([key, value]) => value !== buttonState[key as BuiltInButton])
        ) {
          setButtonState({ ...buttonState, ...state });
        }
      },
      setKeymap(keymap: KeyBinding[]) {
        const commandKeys = Object.entries(commands).reduce(
          (commandKeys: Record<string, string>, [type, fn]) => {
            if (!commandKeys[type]) {
              const binding = keymap.find((binding) => binding.run === fn || binding.shift === fn);
              if (binding?.run === fn) {
                if (keymap.find(({ key }) => key === binding.key)?.run === binding?.run) {
                  return Object.assign(commandKeys, { [type]: fixKey(binding.key!) });
                }
              }

              if (binding?.shift === fn) {
                if (keymap.find(({ key }) => key === binding.key)?.shift === binding?.shift) {
                  return Object.assign(commandKeys, { [type]: fixKey(`Shift-${binding.key}`) });
                }
              }
            }

            return commandKeys;
          },
          { ...extraCommandKeys.current },
        );

        setCommandKeys(commandKeys);
      },
      extraCommandKeys(keys: Record<string, string>) {
        extraCommandKeys.current = keys;
        setCommandKeys({ ...commandKeys, ...keys });
      },
    }),
    [buttonState],
  );

  const renderButtons = () => {
    return buttons.map((button, index) => {
      const type = typeof button === 'string' ? button : button.type;

      switch (type) {
        case '|':
          return <span key={index} className="pf-mde-divider" />;
        case 'custom':
          return typeof button === 'object' ? <span key={index}>{button.render?.()}</span> : null;
        default:
          if (typeof button === 'object' && button.render) {
            return (
              <span key={type} onClick={() => onButtonClick?.(type)}>
                {button.render()}
              </span>
            );
          }

          return renderBuiltInButton(type);
      }
    });
  };

  const renderBuiltInButton = (type: BuiltInButton) => {
    const svgProps = {
      viewBox: '64 64 896 896',
      width: '1em',
      height: '1em',
      fill: 'currentcolor',
      focusable: 'false',
    };
    const iconBinding: { [type in BuiltInButton]: React.ReactNode } = {
      undo: <UndoSvg data-icon="bold" {...svgProps} />,
      redo: <RedoSvg data-icon="redo" {...svgProps} />,
      bold: <BoldSvg data-icon="bold" {...svgProps} />,
      italic: <ItalicSvg data-icon="italic" {...svgProps} />,
      strikethrough: <StrikethroughSvg data-icon="strikethrough" {...svgProps} />,
      heading: <NumberSvg data-icon="heading" {...svgProps} />,
      quote: <QuoteSvg data-icon="quote" {...svgProps} />,
      code: <CodeSvg data-icon="code" {...svgProps} />,
      table: <TableSvg data-icon="table" {...svgProps} />,
      line: <LineSvg data-icon="line" {...svgProps} />,
      unorderedList: <UnorderedListSvg data-icon="unordered-list" {...svgProps} />,
      orderedList: <OrderedListSvg data-icon="ordered-list" {...svgProps} />,
      link: <LinkSvg data-icon="link" {...svgProps} />,
      image: <PictureSvg data-icon="image" {...svgProps} />,
      preview: <EyeSvg data-icon="preview" {...svgProps} />,
      editorPreview: <SplitCellsSvg data-icon="editor-preview" {...svgProps} />,
      fullScreen: <FullscreenSvg data-icon="fullScreen" {...svgProps} />,
    };
    const titleBinding: { [type in BuiltInButton]?: string } = {
      undo: '撤销',
      redo: '恢复',
      bold: '加粗',
      italic: '斜体',
      strikethrough: '删除线',
      heading: '标题',
      quote: '引用',
      code: '代码',
      table: '插入表格',
      line: '插入水平线',
      unorderedList: '无序列表',
      orderedList: '有序列表',
      link: '插入链接',
      image: '插入图片',
      preview: '预览',
      editorPreview: '编辑预览',
      fullScreen: '全屏',
    };

    return (
      <a
        key={type}
        className={classnames('pf-mde-button', {
          'pf-mde-button-active': buttonState[type],
        })}
        title={`${titleBinding[type] ?? type}${commandKeys[type] || ''}`}
        onClick={() => onButtonClick?.(type)}
        children={iconBinding[type] || null}
      />
    );
  };

  return <div className="pf-mde-toolbar">{renderButtons()}</div>;
});

export default Toolbar;
