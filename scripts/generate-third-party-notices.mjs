import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  console.log('Generating npm licenses...');
  let npmLicenses = {};
  try {
    const npmOutput = execSync('npx -y license-checker-rseidelsohn --json --start ./', { cwd: rootDir, encoding: 'utf-8' });
    npmLicenses = JSON.parse(npmOutput);
  } catch (err) {
    console.error('Failed to get npm licenses', err);
  }

  console.log('Generating Python licenses...');
  let pyLicenses = [
    { Name: 'fastapi', Version: 'latest', License: 'MIT', URL: 'https://github.com/tiangolo/fastapi' },
    { Name: 'uvicorn', Version: 'latest', License: 'BSD-3-Clause', URL: 'https://github.com/encode/uvicorn' },
    { Name: 'httpx', Version: 'latest', License: 'BSD-3-Clause', URL: 'https://github.com/encode/httpx' },
    { Name: 'pydantic', Version: 'latest', License: 'MIT', URL: 'https://github.com/pydantic/pydantic' },
    { Name: 'aiofiles', Version: 'latest', License: 'Apache-2.0', URL: 'https://github.com/Tinche/aiofiles' },
    { Name: 'pdf2zh-next', Version: 'latest', License: 'AGPL-3.0', URL: 'https://github.com/BabelDOC/pdf2zh' },
    { Name: 'BabelDOC', Version: 'latest', License: 'AGPL-3.0', URL: 'https://github.com/BabelDOC' }
  ];

  const allLicenses = [];
  const copyleftLicenses = [];

  for (const [pkgName, meta] of Object.entries(npmLicenses)) {
    const lastAt = pkgName.lastIndexOf('@');
    const name = pkgName.substring(0, lastAt);
    const version = pkgName.substring(lastAt + 1);
    if (name === 'frontend' || name === 'worker' || name === 'pdf2zh-web-monorepo') continue;

    const licenseStr = meta.licenses || 'UNKNOWN';
    const item = {
      name,
      version,
      license: licenseStr,
      url: meta.repository || meta.url || '',
      type: 'npm'
    };

    if (licenseStr.includes('AGPL') || licenseStr.includes('GPL')) {
      copyleftLicenses.push(item);
    } else {
      allLicenses.push(item);
    }
  }

  for (const pkg of pyLicenses) {
    const item = {
      name: pkg.Name,
      version: pkg.Version,
      license: pkg.License || 'UNKNOWN',
      url: pkg.URL || '',
      type: 'python'
    };

    if (item.license.includes('AGPL') || item.license.includes('GPL')) {
      copyleftLicenses.push(item);
    } else {
      allLicenses.push(item);
    }
  }

  allLicenses.sort((a, b) => a.name.localeCompare(b.name));
  copyleftLicenses.sort((a, b) => a.name.localeCompare(b.name));

  const finalJson = [...copyleftLicenses, ...allLicenses];
  const outJsonPath = path.join(rootDir, 'frontend', 'public', 'third-party-licenses.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(finalJson, null, 2));
  console.log(`Wrote JSON to ${outJsonPath}`);

  const outMdPath = path.join(rootDir, 'THIRD_PARTY_NOTICES.md');
  let mdContent = `# Third-party notices\n\nThis project uses open-source software.  \nEach dependency is licensed by its respective copyright holder.\n\nGenerated / verified from package metadata where possible.\n\n`;
  
  if (copyleftLicenses.length > 0) {
    mdContent += `## Important copyleft dependencies\n\n`;
    mdContent += `| Package | Version | License | Notes |\n`;
    mdContent += `| --- | --- | --- | --- |\n`;
    for (const pkg of copyleftLicenses) {
      let notes = '';
      if (pkg.name.includes('pdf2zh')) notes = 'Core PDF translation engine';
      else if (pkg.name.includes('BabelDOC')) notes = 'PDF translation / layout backend';
      mdContent += `| ${pkg.name} | ${pkg.version} | ${pkg.license} | ${notes} |\n`;
    }
    mdContent += `\nFor AGPL-3.0 full text, see: https://www.gnu.org/licenses/agpl-3.0.txt\n\n`;
  }

  mdContent += `## Other dependencies\n\n`;
  for (const pkg of allLicenses) {
    mdContent += `### ${pkg.name}\n`;
    mdContent += `- Version: ${pkg.version}\n`;
    mdContent += `- License: ${pkg.license}\n`;
    if (pkg.url) {
      mdContent += `- URL: ${pkg.url}\n`;
    }
    mdContent += `\n`;
  }

  fs.writeFileSync(outMdPath, mdContent);
  console.log(`Wrote MD to ${outMdPath}`);
}

main().catch(console.error);
