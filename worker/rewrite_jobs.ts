import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

const jobsLogicRe = /let settings = null;[\s\S]*?(?=\/\/ 1\. Insert to D1)/;

const newJobsLogic = `
    let providersToSnapshot: any[] = [];

    if (apiKey) {
      llm_credential_mode = 'request_once';
      // User provided a one-off API key
      const tempId = crypto.randomUUID();
      let encKey = null;
      let iv = null;
      let keyVersion = 'v1';
      if (c.env.USER_SETTINGS_SECRET) {
        try {
          const enc = await encryptApiKey(apiKey, c.env.USER_SETTINGS_SECRET, \`user_api_provider:\${uid || 'public_user'}\`);
          encKey = enc.ciphertext;
          iv = enc.iv;
          keyVersion = enc.keyVersion;
        } catch (e) {
          return c.json({ error: 'internal_error', message: 'Failed to encrypt API key' }, 500);
        }
      }
      
      // Get llm_source, model from somewhere, default to openaicompatible
      let source = 'openaicompatible';
      let baseUrl = '';
      let model = '';
      if (ownerType === 'firebase' && uid) {
          const existing = await ensureUserProviders(c.env, uid);
          if (existing.length > 0) {
              source = existing[0].provider_type;
              baseUrl = existing[0].base_url;
              model = existing[0].model;
          }
      }
      
      providersToSnapshot.push({
        display_name: 'Custom',
        provider_type: source,
        base_url: baseUrl,
        model: model,
        encrypted_api_key: encKey,
        api_key_iv: iv,
        api_key_key_version: keyVersion,
        priority: 1
      });

      if (ownerType === 'firebase' && saveApiKey && c.env.USER_SETTINGS_SECRET) {
        try {
          const existingCount = (await c.env.DB.prepare(\`SELECT COUNT(*) as c FROM user_api_providers WHERE user_id = ?\`).bind(uid).first())?.c as number || 0;
          await c.env.DB.prepare(\`
            INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`).bind(crypto.randomUUID(), uid, 'Saved Provider', source, baseUrl, model, encKey, iv, keyVersion, existingCount + 1, 1).run();
        } catch (e) {
          console.error("Failed to save api key to settings", e);
        }
      }
    } else {
      if (ownerType === 'firebase' && uid) {
        llm_credential_mode = 'user_settings';
        const providers = await ensureUserProviders(c.env, uid);
        const enabledProviders = providers.filter((p: any) => p.enabled === 1);
        if (enabledProviders.length === 0) {
          return c.json({ error: 'api_key_required', message: 'Ollama API key is required. Please set it in Settings.' }, 400);
        }
        
        // Re-encrypt api keys for job snapshot
        for (const p of enabledProviders) {
            let encKey = p.encrypted_api_key;
            let iv = p.api_key_iv;
            let keyVersion = p.api_key_key_version;
            
            if (p.encrypted_api_key && p.api_key_iv && c.env.USER_SETTINGS_SECRET) {
                try {
                  const plainKey = await decryptApiKey(
                    p.encrypted_api_key,
                    p.api_key_iv,
                    c.env.USER_SETTINGS_SECRET,
                    \`user_api_provider:\${uid}\`
                  );
                  const reEncrypted = await encryptApiKey(
                    plainKey,
                    c.env.USER_SETTINGS_SECRET,
                    \`job_api_provider:\${id}\`
                  );
                  encKey = reEncrypted.ciphertext;
                  iv = reEncrypted.iv;
                  keyVersion = reEncrypted.keyVersion;
                } catch (e) {
                  console.error("Failed to re-encrypt api key for snapshot", e);
                  return c.json({ error: 'internal_error', message: 'Failed to snapshot settings' }, 500);
                }
            }
            
            providersToSnapshot.push({
                display_name: p.display_name,
                provider_type: p.provider_type,
                base_url: p.base_url,
                model: p.model,
                encrypted_api_key: encKey,
                api_key_iv: iv,
                api_key_key_version: keyVersion,
                priority: p.priority
            });
        }
      } else {
        if (c.env.PUBLIC_FALLBACK_LLM_ENABLED !== 'true') {
          return c.json({ error: 'Public fallback LLM is not configured. Please enter your own Ollama API key or sign in and configure Settings.' }, 503);
        }

        const source = c.env.PUBLIC_FALLBACK_LLM_SOURCE;
        const baseUrl = c.env.PUBLIC_FALLBACK_LLM_BASE_URL;
        const model = c.env.PUBLIC_FALLBACK_LLM_MODEL;
        const fallbackKey = c.env.PUBLIC_FALLBACK_LLM_API_KEY;

        if (!source || !baseUrl || !model || ((source === 'openaicompatible' || source === 'gemini') && !fallbackKey)) {
          return c.json({ error: 'Public fallback LLM is not configured. Please enter your own Ollama API key or sign in and configure Settings.' }, 503);
        }

        llm_credential_mode = 'free_fallback';
        let encKey = null;
        let iv = null;
        let keyVersion = 'v1';
        
        if (fallbackKey && c.env.USER_SETTINGS_SECRET) {
          try {
            const enc = await encryptApiKey(fallbackKey, c.env.USER_SETTINGS_SECRET, \`job_api_provider:\${id}\`);
            encKey = enc.ciphertext;
            iv = enc.iv;
            keyVersion = enc.keyVersion;
          } catch (e) {
            return c.json({ error: 'internal_error', message: 'Failed to encrypt fallback API key' }, 500);
          }
        }
        
        providersToSnapshot.push({
            display_name: 'Public Fallback',
            provider_type: source,
            base_url: baseUrl,
            model: model,
            encrypted_api_key: encKey,
            api_key_iv: iv,
            api_key_key_version: keyVersion,
            priority: 1
        });
      }
    }
    
    if (providersToSnapshot.length > 0) {
        const first = providersToSnapshot[0];
        llm_source = first.provider_type;
        llm_base_url = first.base_url;
        llm_model = first.model;
        encrypted_api_key_snapshot = first.encrypted_api_key;
        api_key_snapshot_iv = first.api_key_iv;
        api_key_key_version = first.api_key_key_version;
    }
`;

content = content.replace(jobsLogicRe, newJobsLogic);

const insertD1Re = /\/\/ 1\. Insert to D1[\s\S]*?console\.log\("POST \/jobs: created job", id, "owner_type:", ownerType\)/;
const newInsertD1 = `
    // 1. Insert to D1
    await c.env.DB.prepare(
      \`INSERT INTO jobs (
        id, user_id, original_filename, status,
        llm_source, llm_base_url, llm_model,
        encrypted_api_key_snapshot, api_key_snapshot_iv, api_key_key_version,
        owner_type, public_receipt_hash, public_client_hash, public_ip_hash,
        public_expires_at, file_size_bytes, turnstile_verified, llm_credential_mode
      ) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`
    ).bind(
      id, uid || 'public_user', file.name,
      llm_source, llm_base_url, llm_model,
      encrypted_api_key_snapshot, api_key_snapshot_iv, api_key_key_version,
      ownerType, publicReceiptHash, publicClientHash, publicIpHash,
      publicExpiresAt, fileSizeBytes, turnstileVerified, llm_credential_mode
    ).run()
    
    // Insert into job_api_provider_snapshots
    if (providersToSnapshot.length > 0) {
        const stmts = providersToSnapshot.map(p => 
            c.env.DB.prepare(\`
                INSERT INTO job_api_provider_snapshots (id, job_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            \`).bind(crypto.randomUUID(), id, p.display_name, p.provider_type, p.base_url, p.model, p.encrypted_api_key, p.api_key_iv, p.api_key_key_version, p.priority)
        );
        await c.env.DB.batch(stmts);
    }
    console.log("POST /jobs: created job", id, "owner_type:", ownerType)
`;

content = content.replace(insertD1Re, newInsertD1);

fs.writeFileSync('src/index.ts', content);
