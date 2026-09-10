export type PublicFallbackConfigError =
  | "missing_source"
  | "missing_endpoint_or_model"
  | "missing_api_key";

export type PublicFallbackProviderSpec = {
  displayName: string;
  providerType: string;
  baseUrl: string;
  model: string;
  priority: number;
  usesServerApiKey: boolean;
};

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

export function publicFallbackProviderPlan(
  source: string | undefined,
  baseUrl: string | undefined,
  model: string | undefined,
  hasApiKey: boolean,
): PublicFallbackProviderSpec[] | null {
  if (publicFallbackConfigError(source, baseUrl, model, hasApiKey)) return null;
  if (source === "siliconflow_free") {
    return [{
      displayName: "SiliconFlow Free",
      providerType: "siliconflow_free",
      baseUrl: "",
      model: "",
      priority: 1,
      usesServerApiKey: false,
    }];
  }
  return [
    {
      displayName: "SiliconFlow Free Tier",
      providerType: source!,
      baseUrl: baseUrl!,
      model: model!,
      priority: 1,
      usesServerApiKey: true,
    },
    {
      displayName: "SiliconFlow Free Fallback",
      providerType: "siliconflow_free",
      baseUrl: "",
      model: "",
      priority: 2,
      usesServerApiKey: false,
    },
  ];
}
