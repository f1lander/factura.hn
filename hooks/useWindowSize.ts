import { useEffect, useState } from "react";

export default function useWindowSize() {
  // Initiated at zero because we don't have access to the window object yet
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [windowHeight, setWindowHeight] = useState<number>(0);

  useEffect(() => {
    const windowSizeHandler = () => {
      if (typeof window !== undefined) {
        setWindowWidth(window.innerWidth);
        setWindowHeight(window.innerHeight);
      }
    };
    window.addEventListener("resize", windowSizeHandler);

    return () => {
      window.removeEventListener("resize", windowSizeHandler);
    };
  }, []);

  return { windowWidth, windowHeight };
}
