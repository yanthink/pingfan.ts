import { MutableRefObject, useCallback, useEffect } from 'react';
import { EditorView } from '@codemirror/basic-setup';

export default (editorViewRef: MutableRefObject<EditorView | null>, storageKey?: string) => {
  const backup = useCallback(() => {
    if (storageKey) {
      const value = editorViewRef.current?.state.doc.toString() || '';
      if (value.length > 0 && !/^(\s|\r?\n)*$/.test(value)) {
        localStorage.setItem(storageKey, value);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, []);

  useEffect(() => {
    if (storageKey) {
      const backupValue = localStorage.getItem(storageKey);
      if (backupValue) {
        const currentValue = editorViewRef.current?.state.doc.toString();
        editorViewRef.current?.dispatch({
          changes: { from: 0, to: currentValue?.length, insert: backupValue },
        });
      }

      window.addEventListener('beforeunload', backup);

      return () => {
        window.removeEventListener('beforeunload', backup);
        backup();
      };
    }
  }, [backup]);
};
