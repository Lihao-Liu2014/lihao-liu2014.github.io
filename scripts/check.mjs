import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.json'),'utf8'));
const base=config.basePath.replace(/\/$/,'');
const errors=[];
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(p,f.name)):[path.join(p,f.name)]);
const files=walk(dist);
for(const file of files.filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');
  for(const token of ['<title>','name="viewport"','id="main"'])if(!html.includes(token))errors.push(`${file}: missing ${token}`);
  for(const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){
    const target=match[1].split('?')[0];
    if(/^[a-z][a-z\d+.-]*:/i.test(target)||target.startsWith('//'))continue;
    if(!target.startsWith(base+'/')){errors.push(`${file}: local URL does not respect basePath: ${target}`);continue;}
    const local=path.join(dist,decodeURIComponent(target.slice(base.length)));
    const exists=fs.existsSync(local)&&(fs.statSync(local).isFile()||fs.existsSync(path.join(local,'index.html')));
    if(!exists)errors.push(`${file}: broken local link ${target}`);
  }
}
const index=JSON.parse(fs.readFileSync(path.join(dist,'search.json'),'utf8'));
for(const p of index){if(!fs.existsSync(path.join(dist,'posts',p.slug,'index.html')))errors.push(`Search links to missing post ${p.slug}`);}
const feed=fs.readFileSync(path.join(dist,'feed.xml'),'utf8');
if((feed.match(/<item>/g)||[]).length!==index.length)errors.push('RSS count does not match published entries.');
if(files.some(f=>f.includes('node_modules')||f.endsWith('.md')||f.endsWith('.env')))errors.push('Source or private files leaked into dist.');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Checked ${files.filter(f=>f.endsWith('.html')).length} pages: local links, search index, RSS, and publish boundaries passed.`);
