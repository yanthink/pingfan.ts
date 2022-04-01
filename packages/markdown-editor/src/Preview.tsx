import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import ReactMarkdown, { Options as ReactMarkdownOptions } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import hljsStyle from 'react-syntax-highlighter/dist/esm/styles/prism/prism';
import useRehype from './hooks/useRehype';
import './Preview.less';

export interface PreviewInstance {
  getMarkdown(): string;

  setMarkdown(markdown: string): void;

  debounceSetMarkdown(markdown: string): void;

  setMarkdownOptions(markdownOptions: Partial<ReactMarkdownOptions>): void;

  getContainer(): HTMLDivElement | null;

  getHast(): any;
}

export interface PreviewProps {
  /**
   * @description 自定义渲染
   */
  render?(markdown: string): React.ReactNode;

  /**
   * @description 刷新间隔
   * @default 1000
   */
  interval?: number;
  /**
   * @description 自动更新（默认当显示预览时为true，否则为false）
   */
  shouldUpdate?: boolean;
  /**
   * @description [remark 插件](https://github.com/remarkjs/react-markdown#plugins)
   */
  remarkPlugins?: ReactMarkdownOptions['remarkPlugins'];
  /**
   * @description [rehype 插件](https://github.com/remarkjs/react-markdown#plugins)
   */
  rehypePlugins?: ReactMarkdownOptions['rehypePlugins'];
  /**
   * @description [react-markdown 选项](https://github.com/remarkjs/react-markdown)
   */
  markdownOptions?: Partial<ReactMarkdownOptions>;
}

const Preview = forwardRef<PreviewInstance, PreviewProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    render,
    interval = 1000,
    remarkPlugins = [],
    rehypePlugins = [],
  } = props;

  const [markdown, setMarkdown] = useState('');
  const [markdownOptions, setMarkdownOptions] = useState<Partial<ReactMarkdownOptions>>(props.markdownOptions || {});

  const debounceSetMarkdown = useMemo(() => debounce(setMarkdown, interval), [interval]);

  const [rehypePlugin, hastRef] = useRehype();

  useImperativeHandle(
    ref,
    () => ({
      getMarkdown: () => markdown,
      setMarkdown,
      debounceSetMarkdown,
      setMarkdownOptions,
      getContainer: () => containerRef.current,
      getHast: () => hastRef.current,
    }),
    [markdown, debounceSetMarkdown],
  );

  return (
    <div ref={containerRef} className="pf-mde-preview-content">
      {render?.(markdown) || (
        <ReactMarkdown
          children={markdown}
          remarkPlugins={[remarkGfm, remarkBreaks, ...remarkPlugins]}
          rehypePlugins={[
            rehypeRaw,
            [
              rehypeSanitize,
              {
                ...defaultSchema,
                attributes: {
                  ...defaultSchema.attributes,
                  code: [...(defaultSchema.attributes?.code || []), 'className'],
                  span: [...(defaultSchema.attributes?.span || []), 'className', 'title'],
                },
              },
            ],
            ...rehypePlugins,
            rehypePlugin,
          ]}
          components={{
            code({ node, inline, className, children, ...props }) {
              if (inline) {
                return (
                  <code className={classnames(className, 'pf-mde-inline-code')} {...props}>
                    {children}
                  </code>
                );
              }

              const match = /language-(\w+)/.exec(className || '');
              if (match) {
                return (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, '')}
                    style={hljsStyle}
                    customStyle={{ borderRadius: 4, background: '#f6f8fa' }}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  />
                );
              }

              return (
                <div className="pf-mde-block-code">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              );
            },
          }}
          {...markdownOptions}
        />
      )}
    </div>
  );
});

export default React.memo(Preview, (prevProps, nextProps) => {
  return (
    !nextProps.shouldUpdate ||
    (prevProps.interval === nextProps.interval)
  );
});
