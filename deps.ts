export {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.101.0/testing/asserts.ts";
export { encode } from "https://deno.land/std@0.103.0/encoding/base64.ts";
export { serve } from "https://deno.land/std@0.103.0/http/server.ts";
export { parse as parseYaml } from "https://deno.land/std@0.103.0/encoding/yaml.ts";
export { createHash } from "https://deno.land/std@0.103.0/hash/mod.ts";
export { extname } from "https://deno.land/std@0.103.0/path/mod.ts";
export { debounce } from "https://deno.land/std@0.103.0/async/mod.ts";

export { gzip } from "https://deno.land/x/compress@v0.3.8/gzip/gzip.ts";
export { tag } from "https://deno.land/x/markup_tag@0.1.2/mod.ts";
import shuffle from "https://deno.land/x/shuffle@v1.0.0/mod.ts";
export { shuffle };
export { range } from "https://deno.land/x/it_range@v1.0.2/mod.ts";
