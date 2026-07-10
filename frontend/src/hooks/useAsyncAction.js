import { useCallback, useRef, useState } from "react";

export default function useAsyncAction() {
  const lockRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (action) => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setLoading(true);
    try {
      return await action();
    } finally {
      lockRef.current = false;
      setLoading(false);
    }
  }, []);

  return { loading, run };
}
