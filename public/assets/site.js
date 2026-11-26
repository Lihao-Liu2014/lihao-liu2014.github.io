const themeButton = document.querySelector('.theme-toggle');
function describeTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton?.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
}
describeTheme();
themeButton?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('commonplace-theme', next); } catch (_) {}
  describeTheme();
});
document.querySelector('[data-copy-link]')?.addEventListener('click', async event => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(location.href);
    button.textContent = 'Link copied';
    document.querySelector('#copy-status').textContent = 'Link copied to clipboard.';
  } catch (_) {
    document.querySelector('#copy-status').textContent = 'Copy the address from your browser to share this page.';
  }
});
const archive = document.querySelector('[data-archive]');
if (archive) {
  const search = document.querySelector('#archive-search');
  const tag = document.querySelector('#tag-filter');
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  if ([...tag.options].some(o => o.value === params.get('tag'))) tag.value = params.get('tag');
  let posts = [];
  const clean = s => String(s).normalize('NFKC').toLocaleLowerCase();
  function update() {
    const query = clean(search.value.trim());
    const matches = posts.filter(p => (!tag.value || p.tags.includes(tag.value)) && (!query || clean([p.title,p.summary,p.text,...p.tags].join(' ')).includes(query)));
    const result = document.querySelector('#archive-results');
    result.replaceChildren();
    for (const p of matches) {
      const article = document.createElement('article'); article.className = 'post-row';
      const date = document.createElement('div'); date.className = 'post-date';
      const time = document.createElement('time'); time.dateTime = p.date; time.textContent = p.displayDate;
      const year = document.createElement('span'); year.textContent = p.date.slice(0,4); date.append(time,year);
      const summary = document.createElement('div'); summary.className = 'post-summary';
      const eyebrow = document.createElement('div'); eyebrow.className = 'post-eyebrow'; eyebrow.textContent = p.tags[0] || '';
      const heading = document.createElement('h3'); const link = document.createElement('a'); link.href = p.url; link.textContent = p.title; heading.append(link);
      const paragraph = document.createElement('p'); paragraph.textContent = p.summary;
      if (p.tags.length) summary.append(eyebrow);
      summary.append(heading);
      if (p.summary) summary.append(paragraph);
      const reading = document.createElement('span'); reading.className = 'read-time'; reading.textContent = `${p.readingTime} min read`;
      article.append(date,summary,reading);result.append(article);
    }
    document.querySelector('#archive-empty').hidden = matches.length > 0;
    document.querySelector('#result-count').textContent = `${matches.length} ${matches.length === 1 ? 'entry' : 'entries'}`;
    const state = new URLSearchParams();
    if (tag.value) state.set('tag',tag.value);
    if (search.value.trim()) state.set('q',search.value.trim());
    history.replaceState(null,'',location.pathname + (state.size ? `?${state}` : ''));
  }
  fetch(archive.dataset.index).then(r=>{ if(!r.ok)throw new Error('Index unavailable');return r.json(); }).then(data=>{
    posts=data; update();
    search.addEventListener('input',update);tag.addEventListener('change',update);
    document.querySelector('#clear-filters').addEventListener('click',()=>{tag.value='';search.value='';update();search.focus();});
  }).catch(()=>{
    document.querySelector('#result-count').textContent = 'Search is unavailable right now. All entries are listed below.';
    search.disabled=true;tag.disabled=true;
  });
}
