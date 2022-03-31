import { MutableRefObject, useRef, useState } from 'react';

export interface DisplayMode {
  fullScreen: boolean;
  preview: boolean;
  editorPreview: boolean;
}

type ToggleFullScreen = (fullScreen?: boolean) => boolean;
type TogglePreview = (preview?: boolean) => boolean;
type ToggleEditorPreview = (editorPreview?: boolean) => boolean;

export default (
  state?: Partial<DisplayMode>,
): [MutableRefObject<DisplayMode>, ToggleFullScreen, TogglePreview, ToggleEditorPreview] => {
  const displayModeRef = useRef<DisplayMode>({
    fullScreen: false,
    preview: false,
    editorPreview: false,
    ...state,
  });

  const [, setModeState] = useState<DisplayMode>(displayModeRef.current);

  const toggleFullScreen: ToggleFullScreen = (fullScreen) => {
    fullScreen ??= !displayModeRef.current.fullScreen;
    const preview = displayModeRef.current.preview;
    const editorPreview = false;

    displayModeRef.current = { fullScreen, preview, editorPreview };
    setModeState(displayModeRef.current);
    return true;
  };

  const togglePreview: TogglePreview = (preview) => {
    preview ??= !displayModeRef.current.preview;
    const fullScreen = displayModeRef.current.fullScreen;
    const editorPreview = false;

    displayModeRef.current = { fullScreen, preview, editorPreview };
    setModeState(displayModeRef.current);
    return true;
  };

  const toggleEditorPreview: ToggleEditorPreview = (editorPreview) => {
    editorPreview ??= !displayModeRef.current.editorPreview;
    const fullScreen = true;
    const preview = false;

    displayModeRef.current = { fullScreen, preview, editorPreview };
    setModeState(displayModeRef.current);
    return true;
  };

  return [displayModeRef, toggleFullScreen, togglePreview, toggleEditorPreview];
};
