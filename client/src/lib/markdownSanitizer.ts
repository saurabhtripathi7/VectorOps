import type { Schema } from "hast-util-sanitize";
import { defaultSchema } from "hast-util-sanitize";

const iframeAttributes = [
  "src",
  "title",
  "allow",
  "allowfullscreen",
  "referrerpolicy",
  "width",
  "height",
];

const imageAttributes = ["src", "alt", "title", "width", "height", "loading"];

const codeAttributes = ["className"];

export const markdownSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "iframe"],
  attributes: {
    ...(defaultSchema.attributes || {}),
    iframe: [...(defaultSchema.attributes?.iframe || []), ...iframeAttributes],
    img: [...(defaultSchema.attributes?.img || []), ...imageAttributes],
    code: [...(defaultSchema.attributes?.code || []), ...codeAttributes],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
    a: [...(defaultSchema.attributes?.a || []), "href", "title", "rel", "target"],
  },
};
