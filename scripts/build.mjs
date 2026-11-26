import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { marked } = await import(require.resolve('marked'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8'));
const base = config.basePath.replace(/\/$/, '');
const url = (p = '') => `${base}/${p.replace(/^\//, '')}`;
const absolute = p => new URL(url(p), config.url).href;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = s => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric', timeZone:'UTC'});
const shortDate = s => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', {month:'short',day:'numeric', timeZone:'UTC'});
const sun = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" stroke="currentColor" stroke-width="1.5"/></svg>';
const searchIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="1.6"/></svg>';
if (!/^https:\/\//.test(config.url)) throw new Error('site.json url must be an HTTPS origin.');
if (base && !/^\/[a-zA-Z0-9_-]+$/.test(base)) throw new Error('basePath must be empty or /repository-name.');
const posts = [];
for (const name of fs.readdirSync(path.join(root, 'content/posts')).filter(n => n.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(root, 'content/posts', name), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${name}: expected a JSON header between --- lines.`);
  const meta = JSON.parse(match[1]);
  const slug = path.basename(name, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${name}: use lowercase words and hyphens.`);
  if (meta.published !== true) continue;
  if (!meta.title || typeof meta.title !== 'string') throw new Error(`${name}: title is required.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !Number.isFinite(Date.parse(meta.date)) || new Date(meta.date).toISOString().slice(0,10) !== meta.date) throw new Error(`${name}: use a valid YYYY-MM-DD date.`);
  if (!['Writings', 'Project'].includes(meta.kind)) throw new Error(`${name}: kind must be Writings or Project.`);
  if (!Array.isArray(meta.tags) || meta.tags.some(t => typeof t !== 'string')) throw new Error(`${name}: tags must be an array of strings.`);
  const words = match[2].split(/\s+/).filter(Boolean).length;
  posts.push({...meta, slug, body: marked.parse(match[2]), readingTime:Math.max(1,Math.ceil(words/220)), text:match[2].replace(/<[^>]+>/g, ' ').replace(/[#*_`]/g, '')});
}
posts.sort((a,b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
const writings = posts.filter(p => p.kind === 'Writings');
const projects = posts.filter(p => p.kind === 'Project');
const collectionRoute = p => p.kind === 'Project' ? 'projects/' : 'archive/';
const entryRoute = p => `${p.kind === 'Project' ? 'projects' : 'posts'}/${p.slug}/`;
fs.rmSync(out, {recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'public'),out,{recursive:true});
const write = (p, data) => {fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true});fs.writeFileSync(path.join(out,p),data);};
const nav = active => `<header class="site-header"><a class="wordmark" href="${url()}"><span class="brand-symbol" aria-hidden="true"></span>${esc(config.title)}<span class="brand-period">.</span></a><nav aria-label="Main navigation"><a ${active==='home'?'aria-current="page"':''} href="${url()}">Home</a><a ${active==='archive'?'aria-current="page"':''} href="${url('archive/')}">Household</a><a ${active==='projects'?'aria-current="page"':''} href="${url('projects/')}">Projects</a><a ${active==='about'?'aria-current="page"':''} href="${url('about/')}">About</a><button type="button" class="icon-button theme-toggle" aria-label="Switch to dark theme" title="Change color theme">${sun}</button></nav></header>`;
const footer = `<footer class="site-footer"><a class="footer-brand" href="${url()}">${esc(config.title)}.</a><div><a href="${url('feed.xml')}">RSS feed</a><a href="${url('about/')}">About this place</a></div></footer>`;
function page({title,description=config.description,active='',route='',content,article=false}) {
  return `<!doctype html><html lang="${esc(config.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title===config.title?title:`${title} · ${config.title}`)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${absolute(route)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:url" content="${absolute(route)}"><link rel="icon" href="${url('assets/rascahouse-mark.png')}" type="image/png"><link rel="alternate" type="application/rss+xml" title="${esc(config.title)}" href="${url('feed.xml')}"><link rel="stylesheet" href="${url('assets/style.css')}"><script src="${url('assets/theme.js')}"></script><script src="${url('assets/site.js')}" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a><div class="site-shell">${nav(active)}<main id="main">${content}</main>${footer}</div></body></html>`;
}
const empty = `<div class="empty-state"><h2>No writings published yet.</h2></div>`;
const postRow = p => `<article class="post-row" data-post><div class="post-date"><time datetime="${p.date}">${shortDate(p.date)}</time><span>${p.date.slice(0,4)}</span></div><div class="post-summary">${p.tags.length?`<div class="post-eyebrow"><span>${esc(p.tags[0])}</span></div>`:''}<h3><a href="${url(entryRoute(p))}">${esc(p.title)}</a></h3>${p.summary?`<p>${esc(p.summary)}</p>`:''}</div><span class="read-time">${p.readingTime} min read</span></article>`;
const latest = writings.slice(0,5).map(postRow).join('') || empty;
write('index.html',page({title:config.title,active:'home',content:`<section class="hero"><div class="hero-copy"><h1>${esc(config.heroTitle)} <em>${esc(config.heroAccent)}</em></h1><div class="hero-links"><a class="button-primary" href="${url('archive/')}">The Household</a><a class="button-secondary" href="${url('projects/')}">Projects</a></div></div></section><section class="entries-section" aria-labelledby="latest-heading"><div class="entries-main"><div class="section-heading"><h2 id="latest-heading">From the Household</h2><a href="${url('archive/')}">View all</a></div>${latest}</div></section>`}));
function collectionPage({title,active,route,items,index,emptyText}) {
  const tags = [...new Set(items.flatMap(p=>p.tags))].sort();
  const content = `<section class="page-heading"><h1>${title}<span class="accent">.</span></h1></section>${items.length?`<section class="archive" data-archive data-index="${url(index)}"><div class="archive-controls"><label class="search-box">${searchIcon}<span class="sr-only">Search ${title === 'The Household' ? 'the Household' : 'Projects'}</span><input type="search" placeholder="Find a word or an idea…" autocomplete="off" id="archive-search"></label><label class="topic-filter">Topic <select id="tag-filter"><option value="">All topics</option>${tags.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label></div><div class="archive-subcontrols"><p id="result-count" aria-live="polite">${items.length} ${items.length===1?'entry':'entries'}</p></div><div id="archive-results">${items.map(postRow).join('')}</div><div id="archive-empty" class="empty-state" hidden><h2>No entries found.</h2><p>Try a different search or clear the filters.</p><button type="button" class="text-button" id="clear-filters">Clear filters</button></div><noscript><p>All entries are listed above. Search and filters need JavaScript.</p></noscript></section>`:`<section class="projects-empty"><p>${emptyText}</p></section>`}`;
  write(`${route}index.html`,page({title,active,route,content}));
}
collectionPage({title:'The Household',active:'archive',route:'archive/',items:writings,index:'search.json',emptyText:'No writings published yet.'});
collectionPage({title:'Projects',active:'projects',route:'projects/',items:projects,index:'projects/search.json',emptyText:'No projects published yet.'});
write('about/index.html',page({title:'About this place',active:'about',route:'about/',content:`<section class="about-layout"><div class="about-main"><h1>${esc(config.aboutTitle)}</h1><div class="prose"><p>${esc(config.aboutText)}</p><p>Browse the <a href="${url('archive/')}">Household</a> by date or subject, or subscribe to the <a href="${url('feed.xml')}">RSS feed</a> to follow along.</p>${config.email?`<p>You can get in touch at <a href="mailto:${esc(config.email)}">${esc(config.email)}</a>.</p>`:''}${config.socialLinks.length?`<ul>${config.socialLinks.map(l=>`<li><a href="${esc(l.url)}" rel="me">${esc(l.label)}</a></li>`).join('')}</ul>`:''}</div></div><div class="about-aside" aria-hidden="true"><span class="about-mark brand-symbol"></span></div></section>`}));
for (const p of posts) {
  const isProject = p.kind === 'Project';
  const collectionName = isProject ? 'Projects' : 'the Household';
  const more=posts.filter(q=>q.slug!==p.slug && q.kind===p.kind).slice(0,2);
  write(`${entryRoute(p)}index.html`,page({title:p.title,description:p.summary,active:isProject?'projects':'archive',route:entryRoute(p),article:true,content:`<article class="reading-page${p.kind==='Writings'?' writing-page':''}"><a class="back-link" href="${url(collectionRoute(p))}">Back to ${collectionName}</a><header class="article-header"><h1>${esc(p.title)}</h1>${p.summary?`<p class="article-deck">${esc(p.summary)}</p>`:''}<div class="article-meta"><time datetime="${p.date}">${dateLabel(p.date)}</time><span>${p.readingTime} min read</span>${(p.author||config.author)?`<span>${esc(p.author||config.author)}</span>`:''}</div></header><div class="prose">${p.body}</div><footer class="article-footer"><div class="article-tags">${p.tags.map(t=>`<a href="${url(`${collectionRoute(p)}?tag=${encodeURIComponent(t)}`)}">${esc(t)}</a>`).join('')}</div><button type="button" class="text-button" data-copy-link>Copy link</button><span class="sr-only" id="copy-status" aria-live="polite"></span></footer></article>${more.length?`<section class="related-posts"><h2>${isProject?'More projects':'Keep reading'}</h2>${more.map(postRow).join('')}</section>`:`<section class="post-end"><a href="${url(collectionRoute(p))}">Return to ${collectionName}</a></section>`}` }));
}
write('404.html',page({title:'Page not found',content:`<section class="not-found"><h1>Page not found.</h1><a class="button-primary" href="${url()}">Return home</a></section>`}));
for (const [index,items] of [['search.json',writings],['projects/search.json',projects]]) {
  write(index,JSON.stringify(items.map(({body,kind,...p})=>({...p,url:url(entryRoute({...p,kind})),displayDate:shortDate(p.date)}))));
}
write('feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(config.title)}</title><link>${absolute('')}</link><description>${esc(config.description)}</description><language>${esc(config.language)}</language><atom:link href="${absolute('feed.xml')}" rel="self" type="application/rss+xml"/>${posts.map(p=>`<item><title>${esc(p.title)}</title><link>${absolute(entryRoute(p))}</link><guid isPermaLink="true">${absolute(entryRoute(p))}</guid><pubDate>${new Date(p.date+'T12:00:00Z').toUTCString()}</pubDate><description>${esc(p.summary)}</description></item>`).join('')}</channel></rss>`);
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','archive/','projects/','about/',...posts.map(entryRoute)].map(p=>`<url><loc>${absolute(p)}</loc></url>`).join('')}</urlset>`);
write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`);
write('.nojekyll','');
console.log(`Built ${posts.length} published entries into dist/.`);
