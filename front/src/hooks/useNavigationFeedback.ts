import { useCallback, useEffect, useRef, useState } from "react";

type UseNavigationFeedbackOptions = {
  delayMs?: number;
};

export const useNavigationFeedback = (
  options: UseNavigationFeedbackOptions = {}
) => {
  const { delayMs = 300 } = options;

  const [isNavigating, setIsNavigating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOverlayTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(
    (navigate: () => void) => {
      if (isNavigating) {
        return;
      }

      setIsNavigating(true);
      setShowOverlay(false);

      clearOverlayTimer();

      timerRef.current = setTimeout(() => {
        setShowOverlay(true);
      }, delayMs);

      navigate();
    },
    [clearOverlayTimer, delayMs, isNavigating]
  );

  const resetNavigation = useCallback(() => {
    clearOverlayTimer();
    setIsNavigating(false);
    setShowOverlay(false);
  }, [clearOverlayTimer]);

  useEffect(() => {
    return () => {
      clearOverlayTimer();
    };
  }, [clearOverlayTimer]);

  return {
    isNavigating,
    showOverlay,
    startNavigation,
    resetNavigation,
  };
};