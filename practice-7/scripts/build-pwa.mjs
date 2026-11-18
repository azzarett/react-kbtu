import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(dir) { const out=[]; for(const e of await readdir(dir,{withFileTypes:true})) { const p=`${dir}/${e.name}`; if(e.isDirectory()) out.push(...await files(p)); else out.push(p); } return out; }
const paths=(await files('dist')).filter(p=>!p.endsWith('/sw.js'));
const template=await readFile('src/common/pwa/sw-template.js','utf8');
const hash=createHash('sha256').update(template);
for(const p of paths.sort()) hash.update(await readFile(p));
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',template.replace('__VERSION__',version).replace('__PRECACHE__',JSON.stringify(paths.map(p=>'./'+p.slice(5)))));
console.log(`PWA ${version}: ${paths.length} precached files`);
