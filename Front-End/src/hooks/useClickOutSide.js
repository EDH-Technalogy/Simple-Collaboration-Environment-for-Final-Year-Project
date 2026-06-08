import React, { useEffect, useRef } from "react";

export function useClickOutSide(handler, listnerCapturing = true) {
  const ref = useRef();
  useEffect(
    function () {
      function clickHandler(e) {
        if (ref.current && !ref.current.contains(e.target)) handler();
      }

      document.addEventListener("click", clickHandler, listnerCapturing);
      return () =>
        document.removeEventListener("click", clickHandler, listnerCapturing);
    },
    [handler, listnerCapturing],
  );
  return ref;
}
