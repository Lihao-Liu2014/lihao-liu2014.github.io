(function () {
  try {
    var saved = localStorage.getItem('commonplace-theme');
    document.documentElement.dataset.theme = saved === 'dark' || saved === 'light' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (_) { document.documentElement.dataset.theme = 'light'; }
})();
