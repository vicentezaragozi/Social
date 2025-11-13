"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

/**
 * Hook to preserve form state across locale changes.
 * 
 * This hook:
 * 1. Saves form data to sessionStorage when locale changes
 * 2. Restores form data from sessionStorage on mount
 * 3. Works with both controlled (useState) and uncontrolled (form inputs) components
 * 
 * Usage for controlled components:
 * ```tsx
 * const [formData, setFormData] = useState({...});
 * useFormStatePreservation('form-key', formData, setFormData);
 * ```
 * 
 * Usage for form refs (uncontrolled):
 * ```tsx
 * const formRef = useRef<HTMLFormElement>(null);
 * useFormStatePreservation('form-key', null, null, { formRef });
 * ```
 */
export function useFormStatePreservation<T>(
  storageKey: string,
  formData: T | null,
  setFormData: ((data: T) => void) | null,
  options?: {
    enabled?: boolean;
    formRef?: React.RefObject<HTMLFormElement | null>;
    onRestore?: (data: T) => void;
  }
) {
  const locale = useLocale();
  const prevLocaleRef = useRef<string>(locale);
  const isRestoredRef = useRef(false);
  const enabled = options?.enabled !== false;
  const formRef = options?.formRef;

  // Restore form state on mount
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || isRestoredRef.current) return;

    try {
      const saved = sessionStorage.getItem(`form-state:${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Restore controlled state
        if (parsed.controlledState) {
          if (setFormData) {
            setFormData(parsed.controlledState as T);
          }
          // Call onRestore callback if provided (for custom restoration logic)
          options?.onRestore?.(parsed.controlledState as T);
        }
        
        // Restore uncontrolled form inputs
        if (formRef?.current && parsed.formData) {
          const form = formRef.current;
          Object.entries(parsed.formData).forEach(([name, value]) => {
            const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (input) {
              if (input.type === "checkbox") {
                (input as HTMLInputElement).checked = Boolean(value);
              } else if (input.type === "radio") {
                const radio = form.querySelector(`[name="${name}"][value="${value}"]`) as HTMLInputElement;
                if (radio) radio.checked = true;
              } else {
                input.value = String(value ?? "");
              }
            }
          });
        }
        
        isRestoredRef.current = true;
      }
    } catch (error) {
      // Ignore errors (invalid JSON, etc.)
    }
  }, [storageKey, enabled, setFormData, formRef, options]);

  // Save form state when locale changes
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    if (prevLocaleRef.current !== locale && prevLocaleRef.current) {
      // Locale changed - save current form state
      try {
        const stateToSave: { controlledState?: T; formData?: Record<string, unknown> } = {};
        
        // Save controlled state
        if (formData !== null) {
          stateToSave.controlledState = formData;
        }
        
        // Save uncontrolled form inputs
        if (formRef?.current) {
          const form = formRef.current;
          const formDataObj: Record<string, unknown> = {};
          const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            "input, textarea, select"
          );
          
          inputs.forEach((input) => {
            if (input.name) {
              if (input.type === "checkbox") {
                formDataObj[input.name] = (input as HTMLInputElement).checked;
              } else if (input.type === "radio") {
                const checked = form.querySelector<HTMLInputElement>(`[name="${input.name}"]:checked`);
                if (checked) {
                  formDataObj[input.name] = checked.value;
                }
              } else {
                formDataObj[input.name] = input.value;
              }
            }
          });
          
          if (Object.keys(formDataObj).length > 0) {
            stateToSave.formData = formDataObj;
          }
        }
        
        sessionStorage.setItem(`form-state:${storageKey}`, JSON.stringify(stateToSave));
      } catch (error) {
        // Ignore errors (quota exceeded, etc.)
      }
    }

    prevLocaleRef.current = locale;
  }, [locale, storageKey, formData, enabled, formRef]);

  // Save form state on unmount (as backup)
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    return () => {
      try {
        const stateToSave: { controlledState?: T; formData?: Record<string, unknown> } = {};
        
        if (formData !== null) {
          stateToSave.controlledState = formData;
        }
        
        if (formRef?.current) {
          const form = formRef.current;
          const formDataObj: Record<string, unknown> = {};
          const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            "input, textarea, select"
          );
          
          inputs.forEach((input) => {
            if (input.name) {
              if (input.type === "checkbox") {
                formDataObj[input.name] = (input as HTMLInputElement).checked;
              } else if (input.type === "radio") {
                const checked = form.querySelector<HTMLInputElement>(`[name="${input.name}"]:checked`);
                if (checked) {
                  formDataObj[input.name] = checked.value;
                }
              } else {
                formDataObj[input.name] = input.value;
              }
            }
          });
          
          if (Object.keys(formDataObj).length > 0) {
            stateToSave.formData = formDataObj;
          }
        }
        
        sessionStorage.setItem(`form-state:${storageKey}`, JSON.stringify(stateToSave));
      } catch (error) {
        // Ignore errors
      }
    };
  }, [storageKey, formData, enabled, formRef]);

  // Function to clear saved state (call after successful submission)
  const clearSavedState = () => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(`form-state:${storageKey}`);
      isRestoredRef.current = false;
    } catch (error) {
      // Ignore errors
    }
  };

  return { clearSavedState };
}
