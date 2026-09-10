export type PublicFallbackConfigError =
  | "missing_source"
  | "missing_endpoint_or_model"
  | "missing_api_key";

export function publicFallbackConfigError(
  source: string | undefined,
  baseUrl: string | undefined,
  model: string | undefined,
  hasApiKey: boolean,
): PublicFallbackConfigError | null {
  if (!source) return "missing_source";
  if (source === "siliconflow_free") return null;
  if (!baseUrl || !model) return "missing_endpoint_or_model";
  if ((source === "openaicompatible" || source === "openai_compatible" || source === "gemini") && !hasApiKey) {
    return "missing_api_key";
  }
  return null;
}
