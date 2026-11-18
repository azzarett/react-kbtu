import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const code=await fs.readFile(process.argv[2],'utf8');
const events={},stores=new Map(),messages=[]; let offline=false,fetches=0,claimed=false,skipped=false;
const scope='https://example.test/react-kbtu/practice-7/';
const key=x=>typeof x==='string'?new URL(x,scope).href:x.url;
const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {async addAll(urls){for(const u of urls)map.set(key(u),new Response(u.includes('offline.html')?'offline __APP_BASE__':'shell '+u));},async match(u){return map.get(key(u))?.clone()},async put(u,r){map.set(key(u),r.clone())},async keys(){return [...map.keys()].map(u=>new Request(u))},async delete(u){return map.delete(key(u))}}},async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)}};
const ctx={URL,Response,Headers,Request,AbortController,setTimeout,clearTimeout,Date,caches,fetch:async(r)=>{fetches++;if(offline)throw Error('offline');return new Response(JSON.stringify({url:key(r)}))},self:{registration:{scope},addEventListener:(n,f)=>events[n]=f,clients:{claim:async()=>{claimed=true},matchAll:async()=>[{postMessage:m=>messages.push(m)}]},skipWaiting:()=>{skipped=true}}};
vm.runInNewContext(code,ctx);
async function lifecycle(n){let p;events[n]({waitUntil:x=>p=x});await p;}
async function req(url,opts={}){let response;events.fetch({request:{url,method:'GET',headers:new Headers(),mode:'cors',...opts},respondWith:r=>response=r});return response?await response:null;}
await caches.open('unrelated-app-cache');await caches.open('polka-task7-shell-old');await lifecycle('install');await lifecycle('activate');assert(claimed);assert(stores.has('unrelated-app-cache'));assert(!stores.has('polka-task7-shell-old'));
assert.equal(await req('https://identitytoolkit.googleapis.com/accounts:signIn'),'null'==='null'?null:null);
assert.equal(await req('https://openlibrary.org/search.json?q=x',{headers:new Headers({Authorization:'Bearer secret'})}),null);
assert.equal(await req('https://openlibrary.org/search.json?q=x',{method:'POST'}),null);
const u='https://openlibrary.org/search.json?q=test';await req(u);offline=true;let r=await req(u);assert.equal(r.headers.get('x-polka-offline'),'true');assert.equal(r.status,200);assert(messages.some(m=>m.type==='API_CACHED'));
r=await req('https://openlibrary.org/search.json?q=uncached');assert.equal(r.status,503);
r=await req(scope,{mode:'navigate'});assert.match(await r.text(),/shell/);
r=await req(scope+'missing/deep',{mode:'navigate'});assert.equal(await r.text(),'offline '+scope);
offline=false;for(let i=0;i<55;i++)await req('https://openlibrary.org/search.json?q='+i);let api=[...stores.entries()].find(([n])=>n.includes('public-'))[1];assert.equal(api.size,50);
let before=fetches;await req(scope+'picture.png');await req(scope+'picture.png');assert.equal(fetches-before,1);
events.message({data:{type:'SKIP_WAITING'}});assert(skipped);
console.log('PASS: lifecycle, scoped cleanup, auth/POST bypass, offline API cache and miss, shell/fallback, API count bound, static cache-first, explicit skip waiting');
