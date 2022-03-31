import { MutableRefObject, useCallback, useRef } from 'react';

export default (): [() => (hast: any) => any, MutableRefObject<any>] => {
  const hastRef = useRef<any>();

  const rehypePlugin = useCallback(() => {
    function transform(hast: any) {
      hastRef.current = hast;

      return hast;
    }

    return transform;
  }, []);

  return [rehypePlugin, hastRef];
};
