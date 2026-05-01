import { useEffect, useRef } from "react";

/** Reveal-on-scroll: adiciona classe `is-visible` quando o elemento entra na viewport.
 *  Aplica tanto no próprio elemento quanto em filhos com `.scroll-reveal`. */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.classList.add("is-visible");
      // Also reveal any child that carries .scroll-reveal
      el.querySelectorAll(".scroll-reveal").forEach((child) =>
        child.classList.add("is-visible")
      );
    };

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
