import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

const utilityFn = `
function isOpenAICompatibleProvider(providerType: string | null | undefined): boolean {
  return providerType === "openai_compatible" || providerType === "openaicompatible";
}
`;

// Insert utility function after imports
content = content.replace(/(import { [^}]+ } from 'hono\/cors';)/, `$1\n${utilityFn}`);

// Replace checks
content = content.replace(/\(oldSettings\.llm_source as string\) === 'openaicompatible'/g, `isOpenAICompatibleProvider(oldSettings.llm_source as string)`);
content = content.replace(/p\.provider_type === 'openaicompatible'/g, `isOpenAICompatibleProvider(p.provider_type)`);
content = content.replace(/source === 'openaicompatible'/g, `isOpenAICompatibleProvider(source)`);
content = content.replace(/provider\.provider_type !== 'openaicompatible'/g, `!isOpenAICompatibleProvider(provider.provider_type)`);

// Replace array includes
content = content.replace(/\['openaicompatible',/g, `['openai_compatible', 'openaicompatible',`);

// Replace default strings
content = content.replace(/'openaicompatible', 'https:\/\/api\.ollama\.com\/v1'/g, `'openai_compatible', 'https://api.ollama.com/v1'`);
content = content.replace(/llm_source: 'openaicompatible'/g, `llm_source: 'openai_compatible'`);
content = content.replace(/\?\? 'openaicompatible'/g, `?? 'openai_compatible'`);
content = content.replace(/llm_source = 'openaicompatible'/g, `llm_source = 'openai_compatible'`);
content = content.replace(/source = 'openaicompatible'/g, `source = 'openai_compatible'`);
content = content.replace(/default to openaicompatible/g, `default to openai_compatible`);

fs.writeFileSync('src/index.ts', content);
