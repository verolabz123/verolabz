"use client";

import { useEffect } from "react";

/**
 * HydrationProvider Component
 *
 * Handles browser extension attribute cleanup to prevent hydration warnings.
 * Browser extensions like password managers and ad blockers add attributes
 * to the DOM which cause React hydration mismatches.
 *
 * This component runs on the client-side after hydration to clean up these
 * attributes without causing hydration errors.
 */
export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // List of attributes added by browser extensions
    const extensionAttributes = [
      "bis_skin_checked",
      "fdprocessedid",
      "bis_register",
      "__processed_6b42e59e-af44-4888-b68f-e5570531d917__",
      "data-new-gr-c-s-check-loaded",
      "data-gr-ext-installed",
    ];

    // Function to clean attributes from an element
    const cleanElement = (element: Element) => {
      extensionAttributes.forEach((attr) => {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr);
        }
      });
    };

    // Clean all existing elements
    const cleanAllElements = () => {
      const selector = extensionAttributes
        .map((attr) => `[${attr}]`)
        .join(", ");

      const elements = document.querySelectorAll(selector);
      elements.forEach(cleanElement);
    };

    // Initial cleanup
    cleanAllElements();

    // Set up mutation observer to catch future additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          const target = mutation.target as Element;
          const attrName = mutation.attributeName;

          if (attrName && extensionAttributes.includes(attrName)) {
            target.removeAttribute(attrName);
          }
        }
      });
    });

    // Observe the entire document
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: extensionAttributes,
    });

    // Cleanup on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}
