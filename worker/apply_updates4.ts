import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

const utilityFn = `
function isOpenAICompatibleProvider(providerType: string | null | undefined): boolean {
  return providerType === "openai_compatible" || providerType === "openaicompatible";
}
`;

// Insert utility function after imports
content = content.replace(/(import \{ createRemoteJWKSet, jwtVerify, createLocalJWKSet \} from 'jose')/, `$1\n${utilityFn}`);

fs.writeFileSync('src/index.ts', content);
