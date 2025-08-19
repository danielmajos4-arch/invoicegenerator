import { useEffect, useRef } from "react";

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => void;
  delay?: number;
  enabled?: boolean;
}

/**
 * Auto-save hook that saves data to localStorage after a delay
 * Useful for preventing data loss on form inputs
 */
export function useAutoSave({ 
  data, 
  onSave, 
  delay = 3000, // 3 seconds default
  enabled = true 
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentData === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onSave(data);
      lastSavedRef.current = currentData;
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}