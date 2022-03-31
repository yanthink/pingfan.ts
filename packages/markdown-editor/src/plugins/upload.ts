import { EditorView } from '@codemirror/view';
import type { ChangeSpec } from '@codemirror/state';

interface UploadConfig {
  url: string;
  name?: string;
  allowedTypes?: string | string[];
  timeout?: number;
  headers?: HeadersInit;
  data?: object | ((file: File) => object | Promise<object>);
  withCredentials?: boolean;
  beforeUpload?: (file: File) => boolean | Promise<File>;
  transform?: (res: object | string, xhr: XMLHttpRequest) => { url: string; title?: string };
  onSuccess?: (res: object | string, xhr: XMLHttpRequest, file: File) => void;
  onError?: (xhr: XMLHttpRequest, file: File) => void;
}

interface ExtendFile extends File {
  uid?: string;
}

class Uploader {
  config: UploadConfig;

  template: string = '[${uid}${text}]()';

  index: number = 0;

  queue: (() => void)[] = [];

  constructor(config: UploadConfig) {
    this.config = config;
  }

  intervalQueue(fn: () => void) {
    this.queue.push(fn);

    const handleQueue = () => {
      if (this.queue.length > 0) {
        this.queue[0]();

        setTimeout(() => {
          this.queue.shift();
          handleQueue();
        }, 1);
      }
    };

    if (this.queue.length === 1) {
      handleQueue();
    }
  }

  isFileAllowed(file: File) {
    const { allowedTypes = '*' } = this.config;
    return [allowedTypes]
      .flat()
      .some((pattern) => new RegExp(`^${pattern.replace('*', '.*')}`).test(file.type));
  }

  isImage(file: ExtendFile) {
    return /image/.test(file.type);
  }

  prepareFiles(files: File[] | FileList) {
    const fileList: ExtendFile[] = [];

    for (const file of files) {
      if (!this.isFileAllowed(file)) {
        continue;
      }

      if (!Object.isFrozen(file)) {
        this.index++;
        (file as ExtendFile).uid = this.index.toString().padStart(3, '0');
      }

      fileList.push(file);
    }

    return fileList;
  }

  parseTemplate(file: ExtendFile, text: string = '') {
    const content = this.template.replace('${uid}', file.uid || '').replace('${text}', text);

    return this.isImage(file) ? '!' + content : content;
  }

  existTemplateContent(file: ExtendFile, view: EditorView) {
    const regexpString = this.parseTemplate(file, '.*').replace(/[!\[\]()]/g, '\\$&');
    return new RegExp(regexpString, 'g').test(view.state.doc.toString());
  }

  updateTemplateContent(content: string, file: ExtendFile, view: EditorView) {
    const doc = view.state.doc.toString();

    let regexpString = this.parseTemplate(file, '.*').replace(/[!\[\]()]/g, '\\$&');
    if (!content) {
      regexpString += '\n{0,2}';
    }
    const regexp = new RegExp(regexpString, 'g');

    let match;
    const changes: ChangeSpec[] = [];

    while ((match = regexp.exec(doc)) !== null) {
      changes.push({ from: match.index, to: regexp.lastIndex, insert: content });
    }

    if (changes.length > 0) {
      view.dispatch({ changes, userEvent: 'input' });
      return true;
    }

    return false;
  }

  async uploadFiles(files: File[] | FileList, view: EditorView) {
    const fileList = this.prepareFiles(files);

    if (fileList.length < 1) return;

    this.intervalQueue(() => {
      const insertList = fileList.map((file) => this.parseTemplate(file, ' waiting...'));
      const changes = view.state.replaceSelection([...insertList, ''].join('\n\n'));
      view.dispatch(changes, { userEvent: 'input' });
    });

    for (const file of fileList) {
      try {
        await this.upload(file, view);
      } catch {}
    }
  }

  async upload(file: ExtendFile, view: EditorView) {
    if (typeof XMLHttpRequest === 'undefined') return;

    let {
      url,
      name = 'file',
      timeout = 60000,
      headers = {},
      data = {},
      withCredentials,
      beforeUpload,
      onError,
    } = this.config;

    const _file = await beforeUpload?.(file);
    if (_file === false) return;
    if (_file instanceof File) file = _file;

    if (typeof data === 'function') {
      data = await data(file);
    }

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.timeout = timeout;
      xhr.ontimeout = (e) => {
        this.onError(xhr, file, view);
        reject();
      };
      xhr.upload.onprogress = (e) => {
        if (!this.onProgress(e, file, view)) {
          xhr.abort();
        }
      };
      xhr.onabort = (e) => {
        this.onError(xhr, file, view);
        reject();
      };
      xhr.onerror = (e) => {
        this.onError(xhr, file, view);
        reject();
      };
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          this.onSuccess(xhr, file, view);
          resolve();
          return;
        }

        this.onError(xhr, file, view);
        reject();
      };

      xhr.open('post', url, true);

      if (withCredentials && 'withCredentials' in xhr) {
        xhr.withCredentials = true;
      }

      Object.assign(headers, { 'X-Requested-With': 'XMLHttpRequest' });
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      const formData = new FormData();
      Object.entries(data).map(([key, value]) => {
        formData.append(key, value);
      });
      formData.append(name, file);

      xhr.send(formData);

      const content = this.parseTemplate(file, ` Uploading... 0%`);
      this.intervalQueue(() => this.updateTemplateContent(content, file, view));
    });
  }

  onProgress(e: ProgressEvent, file: ExtendFile, view: EditorView) {
    if (!this.existTemplateContent(file, view)) {
      return false;
    }

    const percent = (e.loaded / e.total) * 100;

    const content = this.parseTemplate(file, ` Uploading... ${percent}%`);

    this.intervalQueue(() => this.updateTemplateContent(content, file, view));

    return true;
  }

  getBody(xhr: XMLHttpRequest) {
    const text = xhr.responseText || xhr.response;
    if (!text) return text;

    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  onSuccess(xhr: XMLHttpRequest, file: ExtendFile, view: EditorView) {
    const { transform, onSuccess } = this.config;
    const res = this.getBody(xhr);
    const { url, title = 'image' } = transform?.(res, xhr) || res;

    const content = (this.isImage(file) ? '!' : '') + `[${title}](${url})`;

    this.intervalQueue(() => {
      if (this.existTemplateContent(file, view)) {
        return this.updateTemplateContent(content, file, view);
      }

      const changes = view.state.replaceSelection(content);
      view.dispatch(changes, { userEvent: 'input' });
    });

    onSuccess?.(res, xhr, file);
  }

  onError(xhr: XMLHttpRequest, file: ExtendFile, view: EditorView) {
    const { onError } = this.config;

    this.intervalQueue(() => {
      this.updateTemplateContent('', file, view);
    });

    onError?.(xhr, file);
  }
}

const upload = (config: UploadConfig) => {
  const uploader = new Uploader(config);

  return EditorView.domEventHandlers({
    paste(event, view) {
      const { clipboardData } = event;

      const files = [];

      if (clipboardData && typeof clipboardData === 'object') {
        const items = clipboardData.items || clipboardData.files || [];

        for (const item of items) {
          if (item instanceof DataTransferItem) {
            const file = item.getAsFile();
            if (item.kind !== 'string' && file) {
              files.push(file);
            }
            continue;
          }

          files.push(item as File);
        }
      }

      if (files.length > 0) {
        event.preventDefault();
        uploader.uploadFiles(files, view);
      }
    },
    drop(event, view) {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        uploader.uploadFiles(event.dataTransfer.files, view);
      }
    },
  });
};

export default upload;
