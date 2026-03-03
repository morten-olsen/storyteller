import type { NarrationStyle } from "./types.js";

type NarrationStyleDef = {
  id: NarrationStyle;
  name: string;
  description: string;
  promptInstruction: string;
};

const NARRATION_STYLES: NarrationStyleDef[] = [
  {
    id: "simple",
    name: "Simple",
    description: "Short sentences, everyday words, easy to follow",
    promptInstruction:
      "Use simple vocabulary and short, clear sentences. Avoid metaphors, complex clauses, and obscure words. Write as if for a young reader — direct, vivid, and easy to follow at a glance.",
  },
  {
    id: "casual",
    name: "Casual",
    description: "Conversational and modern, easy reading on the go",
    promptInstruction:
      "Write in a relaxed, conversational tone. Use natural modern language, moderate sentence length, and clear descriptions. Accessible and engaging without being literary.",
  },
  {
    id: "literary",
    name: "Literary",
    description: "Rich descriptions, varied vocabulary, literary flair",
    promptInstruction:
      "Write with literary quality — varied sentence structure, evocative descriptions, and a confident narrative voice. Allow metaphors and imagery but keep the prose flowing and readable.",
  },
  {
    id: "ornate",
    name: "Ornate",
    description: "Dense, elevated prose with poetic complexity",
    promptInstruction:
      "Write in dense, elevated prose. Use complex sentence structures, rich vocabulary, layered metaphors, and poetic rhythm. Prioritize atmosphere and linguistic craft over simplicity.",
  },
];

const getNarrationStyle = (id: NarrationStyle): NarrationStyleDef | undefined => {
  return NARRATION_STYLES.find((s) => s.id === id);
};

export type { NarrationStyleDef };
export { NARRATION_STYLES, getNarrationStyle };
