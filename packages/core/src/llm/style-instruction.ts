import type { NarrationStyle } from "../types.js";
import { getNarrationStyle } from "../narration-styles.js";

const styleInstruction = (style: NarrationStyle): string => {
  const def = getNarrationStyle(style);
  if (!def) {
    return "";
  }
  return `\n\nWRITING STYLE: ${def.promptInstruction}`;
};

export { styleInstruction };
