import { brand } from "@/lib/brand";
import { it } from "./it";
import { en } from "./en";

export const t = brand.locale === "it" ? it : en;
export type { Strings } from "./it";
