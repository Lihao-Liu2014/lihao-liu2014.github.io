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
const book = '<svg viewBox="0 0 28 30" fill="none" aria-hidden="true"><path d="M5 3h15a3 3 0 0 1 3 3v21H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" stroke="currentColor" stroke-width="1.7"/><path d="M8 3v20m-4 1c0-1.7 1.3-3 3-3h16M12 8h7m-7 4h5" stroke="currentColor" stroke-width="1.7"/></svg>';
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
  if (!['Writings', 'Note', 'Project'].includes(meta.kind)) throw new Error(`${name}: kind must be Writings, Note, or Project.`);
  if (!Array.isArray(meta.tags) || meta.tags.some(t => typeof t !== 'string')) throw new Error(`${name}: tags must be an array of strings.`);
  const words = match[2].split(/\s+/).filter(Boolean).length;
  posts.push({...meta, slug, body: marked.parse(match[2]), readingTime:Math.max(1,Math.ceil(words/220)), text:match[2].replace(/<[^>]+>/g, ' ').replace(/[#*_`]/g, '')});
}
posts.sort((a,b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
fs.rmSync(out, {recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
fs.cpSync(path.join(root,'public'),out,{recursive:true});
const write = (p, data) => {fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true});fs.writeFileSync(path.join(out,p),data);};
const nav = active => `<header class="site-header"><a class="wordmark" href="${url()}"><span class="brand-symbol">${book}</span>${esc(config.title)}<span class="brand-period">.</span></a><nav aria-label="Main navigation"><a ${active==='home'?'aria-current="page"':''} href="${url()}">Home</a><a ${active==='archive'?'aria-current="page"':''} href="${url('archive/')}">Household</a><a ${active==='about'?'aria-current="page"':''} href="${url('about/')}">About</a><button type="button" class="icon-button theme-toggle" aria-label="Switch to dark theme" title="Change color theme">${sun}</button></nav></header>`;
const footer = `<footer class="site-footer"><a class="footer-brand" href="${url()}">${esc(config.title)}.</a><div><a href="${url('feed.xml')}">RSS feed</a><a href="${url('about/')}">About this place</a></div></footer>`;
function page({title,description=config.description,active='',route='',content,article=false}) {
  return `<!doctype html><html lang="${esc(config.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title===config.title?title:`${title} · ${config.title}`)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${absolute(route)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:url" content="${absolute(route)}"><link rel="icon" href="${url('assets/favicon.svg')}" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="${esc(config.title)}" href="${url('feed.xml')}"><link rel="stylesheet" href="${url('assets/style.css')}"><script src="${url('assets/theme.js')}"></script><script src="${url('assets/site.js')}" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a><div class="site-shell">${nav(active)}<main id="main">${content}</main>${footer}</div></body></html>`;
}
const empty = `<div class="empty-state"><span class="empty-mark" aria-hidden="true">✳︎</span><h3>No entries yet.</h3></div>`;
const postRow = p => `<article class="post-row" data-post><div class="post-date"><time datetime="${p.date}">${shortDate(p.date)}</time><span>${p.date.slice(0,4)}</span></div><div class="post-summary"><div class="post-eyebrow"><span>${esc(p.kind)}</span>${p.tags.length?`<span class="meta-divider">/</span><span>${esc(p.tags[0])}</span>`:''}</div><h3><a href="${url(`posts/${p.slug}/`)}">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div><span class="read-time">${p.readingTime} min read</span></article>`;
const latest = posts.slice(0,5).map(postRow).join('') || empty;
const paperArt = `<div class="paper-art" aria-hidden="true"><div class="paper paper-back"><div class="grid-lines"></div></div><div class="paper paper-middle"><div class="paper-lines"><i></i><i></i><i></i><i></i></div><div class="circle-sketch"></div></div><div class="paper paper-front"><span class="paper-star">✳︎</span><div class="paper-quote">Words.<br>Wonders.<br><em>Whatever<br>comes next.</em></div></div><div class="paper-clip"></div></div>`;
write('index.html',page({title:config.title,active:'home',content:`<section class="hero"><div class="hero-copy"><h1>${esc(config.heroTitle)}<br><em>${esc(config.heroAccent)}</em></h1>${config.intro?`<p class="hero-intro">${esc(config.intro)}</p>`:''}<a class="button-primary" href="${url('archive/')}">Explore the household</a></div>${paperArt}</section><section class="entries-section" aria-labelledby="latest-heading"><div class="entries-main"><div class="section-heading"><h2 id="latest-heading">From the notebook</h2><a href="${url('archive/')}">View all entries</a></div>${latest}</div><aside class="sidebar"><h2>Browse</h2><a class="shelf-link" href="${url('archive/?kind=Writings')}"><span>Writings</span></a><a class="shelf-link" href="${url('archive/?kind=Note')}"><span>Notes</span></a><a class="shelf-link" href="${url('archive/?kind=Project')}"><span>Projects</span></a></aside></section>`}));
const tags = [...new Set(posts.flatMap(p=>p.tags))].sort();
write('archive/index.html',page({title:'The household',active:'archive',route:'archive/',content:`<section class="page-heading"><h1>The household<span class="accent">.</span></h1></section><section class="archive" data-archive data-index="${url('search.json')}"><div class="archive-controls"><div class="kind-filters" role="group" aria-label="Filter by writing type">${['All','Writings','Note','Project'].map(k=>`<button type="button" data-kind="${k}" aria-pressed="${k==='All'}">${{All:'All entries',Writings:'Writings',Note:'Notes',Project:'Projects'}[k]}</button>`).join('')}</div><label class="search-box">${searchIcon}<span class="sr-only">Search the household</span><input type="search" placeholder="Find a word or an idea…" autocomplete="off" id="archive-search"></label></div><div class="archive-subcontrols"><p id="result-count" aria-live="polite">${posts.length} ${posts.length===1?'entry':'entries'}</p><label>Topic <select id="tag-filter"><option value="">All topics</option>${tags.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label></div><div id="archive-results">${posts.map(postRow).join('')||empty}</div><div id="archive-empty" class="empty-state" hidden><span class="empty-mark" aria-hidden="true">✳︎</span><h2>No entries found.</h2><p>Try a different search or clear the filters.</p><button type="button" class="text-button" id="clear-filters">Clear filters</button></div><noscript><p>All entries are listed above. Search and filters need JavaScript.</p></noscript></section>`}));
write('about/index.html',page({title:'About this place',active:'about',route:'about/',content:`<section class="about-layout"><div class="about-main"><h1>${esc(config.aboutTitle)}</h1><div class="prose"><p>${esc(config.aboutText)}</p><p>Browse the <a href="${url('archive/')}">household</a> by date or subject, or subscribe to the <a href="${url('feed.xml')}">RSS feed</a> to follow along.</p>${config.email?`<p>You can get in touch at <a href="mailto:${esc(config.email)}">${esc(config.email)}</a>.</p>`:''}${config.socialLinks.length?`<ul>${config.socialLinks.map(l=>`<li><a href="${esc(l.url)}" rel="me">${esc(l.label)}</a></li>`).join('')}</ul>`:''}</div></div><div class="about-aside" aria-hidden="true"><span class="large-asterisk">✳︎</span></div></section>`}));
for (const [i,p] of posts.entries()) {
  const more=posts.filter(q=>q.slug!==p.slug).slice(0,2);
  write(`posts/${p.slug}/index.html`,page({title:p.title,description:p.summary,active:'archive',route:`posts/${p.slug}/`,article:true,content:`<article class="reading-page${p.kind==='Writings'?' writing-page':''}"><a class="back-link" href="${url('archive/')}">Back to the household</a><header class="article-header"><p class="eyebrow">${esc(p.kind)}</p><h1>${esc(p.title)}</h1><p class="article-deck">${esc(p.summary)}</p><div class="article-meta"><time datetime="${p.date}">${dateLabel(p.date)}</time><span>${p.readingTime} min read</span>${(p.author||config.author)?`<span>${esc(p.author||config.author)}</span>`:''}</div></header><div class="prose">${p.body}</div><footer class="article-footer"><div class="article-tags">${p.tags.map(t=>`<a href="${url(`archive/?tag=${encodeURIComponent(t)}`)}">${esc(t)}</a>`).join('')}</div><button type="button" class="text-button" data-copy-link>Copy link</button><span class="sr-only" id="copy-status" aria-live="polite"></span></footer></article>${more.length?`<section class="related-posts"><h2>Keep reading</h2>${more.map(postRow).join('')}</section>`:`<section class="post-end"><a href="${url('archive/')}">Return to the household</a></section>`}` }));
}
write('404.html',page({title:'Page not found',content:`<section class="not-found"><h1>Page not found.</h1><a class="button-primary" href="${url()}">Return home</a></section>`}));
write('search.json',JSON.stringify(posts.map(({body,...p})=>({...p,url:url(`posts/${p.slug}/`),displayDate:shortDate(p.date)}))));
write('feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(config.title)}</title><link>${absolute('')}</link><description>${esc(config.description)}</description><language>${esc(config.language)}</language><atom:link href="${absolute('feed.xml')}" rel="self" type="application/rss+xml"/>${posts.map(p=>`<item><title>${esc(p.title)}</title><link>${absolute(`posts/${p.slug}/`)}</link><guid isPermaLink="true">${absolute(`posts/${p.slug}/`)}</guid><pubDate>${new Date(p.date+'T12:00:00Z').toUTCString()}</pubDate><description>${esc(p.summary)}</description></item>`).join('')}</channel></rss>`);
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','archive/','about/',...posts.map(p=>`posts/${p.slug}/`)].map(p=>`<url><loc>${absolute(p)}</loc></url>`).join('')}</urlset>`);
write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`);
write('.nojekyll','');
console.log(`Built ${posts.length} published entries into dist/.`);
