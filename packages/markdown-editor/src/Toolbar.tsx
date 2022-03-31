import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import classnames from 'classnames';
import type { KeyBinding } from '@codemirror/view';
import Icon from '@ant-design/icons';
import UndoOutlined from '@ant-design/icons/UndoOutlined';
import RedoOutlined from '@ant-design/icons/RedoOutlined';
import BoldOutlined from '@ant-design/icons/BoldOutlined';
import ItalicOutlined from '@ant-design/icons/ItalicOutlined';
import StrikethroughOutlined from '@ant-design/icons/StrikethroughOutlined';
import NumberOutlined from '@ant-design/icons/NumberOutlined';
import TableOutlined from '@ant-design/icons/TableOutlined';
import LineOutlined from '@ant-design/icons/LineOutlined';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';
import OrderedListOutlined from '@ant-design/icons/OrderedListOutlined';
import LinkOutlined from '@ant-design/icons/LinkOutlined';
import PictureOutlined from '@ant-design/icons/PictureOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import SplitCellsOutlined from '@ant-design/icons/SplitCellsOutlined';
import FullscreenOutlined from '@ant-design/icons/FullscreenOutlined';
import CodeSvg from './svg/code.svg';
import QuoteSvg from './svg/quote.svg';
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
    const iconBinding: { [type in BuiltInButton]: React.ReactNode } = {
      undo: <UndoOutlined />,
      redo: <RedoOutlined />,
      bold: <BoldOutlined />,
      italic: <ItalicOutlined />,
      strikethrough: <StrikethroughOutlined />,
      heading: <NumberOutlined />,
      quote: <Icon component={QuoteSvg} />,
      code: <Icon component={CodeSvg} />,
      table: <TableOutlined />,
      line: <LineOutlined />,
      unorderedList: <UnorderedListOutlined />,
      orderedList: <OrderedListOutlined />,
      link: <LinkOutlined />,
      image: <PictureOutlined />,
      preview: <EyeOutlined />,
      editorPreview: <SplitCellsOutlined />,
      fullScreen: <FullscreenOutlined />,
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
