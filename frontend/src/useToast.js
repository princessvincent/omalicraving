import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((msg) => {
    setMessage(msg);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2200);
  }, []);

  return { message, show, toast };
}
