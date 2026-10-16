export const MAIN_ID = "main";

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-text focus:px-5 focus:py-3 focus:font-medium focus:text-void"
    >
      Skip to content
    </a>
  );
}
