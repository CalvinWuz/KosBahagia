/** JSON for a <script type="application/ld+json">: no "</script>" or HTML comment can break out. */
export function jsonAman(x: unknown): string {
  return JSON.stringify(x).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
