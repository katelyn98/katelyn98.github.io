(() => {
  const explorer = document.querySelector('[data-publication-explorer]');
  const dataElement = document.querySelector('#publication-atlas-data');
  if (!explorer || !dataElement) return;

  const data = JSON.parse(dataElement.textContent);
  const themes = Object.entries(data.themes).map(([id, theme]) => ({ id, ...theme }));
  const papers = [...explorer.querySelectorAll('[data-publication]')].map(row => ({
    key: row.dataset.key,
    year: Number(row.dataset.year),
    theme: data.papers[row.dataset.key]?.theme || 'trustworthy',
    image: data.papers[row.dataset.key]?.image,
    imageAlt: data.papers[row.dataset.key]?.image_alt,
    summary: data.papers[row.dataset.key]?.summary,
    title: row.querySelector('.title')?.textContent.trim() || row.dataset.key,
    authors: row.querySelector('.author')?.textContent.replace(/\s+/g, ' ').trim() || '',
    authorsHtml: row.querySelector('.author')?.innerHTML || '',
    venue: row.querySelector('.periodical')?.textContent.replace(/\s+/g, ' ').trim() || '',
    type: row.querySelector('.abbr abbr')?.textContent.trim() || 'Publication',
    recognition: row.querySelector('.publication-recognition')?.textContent.trim() || '',
    abstract: row.querySelector('.abstract.hidden p')?.textContent.trim() || '',
    links: [...row.querySelectorAll('.links a[href]')].map(a => ({ href: a.href, label: a.textContent.trim() }))
  })).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

  const search = explorer.querySelector('[data-publication-search]');
  const yearSelect = explorer.querySelector('[data-publication-year]');
  const controls = explorer.querySelector('[data-publication-themes]');
  const results = explorer.querySelector('[data-publication-results]');
  const detail = explorer.querySelector('[data-publication-detail]');
  const count = explorer.querySelector('[data-publication-count]');
  const state = { theme: 'all', year: 'all', query: '', selected: null };

  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  };

  const showDetails = (paper, moveFocus = false) => {
    state.selected = paper.key;
    detail.hidden = false;
    const theme = data.themes[paper.theme];
    detail.style.setProperty('--detail-color', theme.color);
    detail.querySelector('[data-detail-theme]').textContent = theme.label;
    detail.querySelector('[data-detail-title]').textContent = paper.title;
    detail.querySelector('[data-detail-meta]').textContent = [paper.type, paper.venue, paper.recognition].filter(Boolean).join(' · ');
    detail.querySelector('[data-detail-authors]').innerHTML = paper.authorsHtml;
    detail.querySelector('[data-detail-abstract]').textContent = paper.abstract || 'No abstract is available for this paper. Open the publication below for more information.';
    detail.querySelector('[data-detail-links]').replaceChildren(...paper.links.map(link => {
      const a = make('a', '', link.label);
      a.href = link.href;
      if (new URL(link.href).origin !== location.origin) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      return a;
    }));
    results.querySelectorAll('[data-paper-key]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.paperKey === paper.key));
    });
    if (moveFocus) {
      detail.focus({ preventScroll: true });
      detail.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  };

  const render = () => {
    const visible = papers.filter(p =>
      (state.theme === 'all' || p.theme === state.theme) &&
      (state.year === 'all' || String(p.year) === state.year) &&
      `${p.title} ${p.authors} ${p.venue} ${p.year}`.toLowerCase().includes(state.query)
    );
    count.textContent = `${visible.length} of ${papers.length} publications`;
    results.replaceChildren();
    controls.querySelectorAll('button').forEach(button => {
      const active = button.dataset.theme === state.theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    themes.forEach(theme => {
      const group = visible.filter(p => p.theme === theme.id);
      if (!group.length) return;
      const section = make('section', 'publication-browser__group');
      const heading = make('h3', '', `${theme.label} (${group.length})`);
      section.append(heading);
      section.append(make('p', 'publication-browser__theme-question', theme.description));
      group.forEach(paper => {
        const button = make('button', 'publication-browser__paper');
        button.type = 'button';
        button.dataset.paperKey = paper.key;
        if (paper.image) {
          const image = make('img', 'publication-browser__thumbnail');
          image.src = paper.image;
          image.alt = paper.imageAlt || '';
          image.loading = 'lazy';
          button.append(image);
          button.classList.add('has-thumbnail');
        }
        const copy = make('span', 'publication-browser__paper-copy');
        copy.append(make('span', 'publication-browser__paper-meta', `${paper.year} · ${paper.type}`), make('span', 'publication-browser__paper-title', paper.title));
        if (paper.authors) copy.append(make('span', 'publication-browser__paper-authors', paper.authors));
        if (paper.summary) copy.append(make('span', 'publication-browser__paper-summary', paper.summary));
        button.append(copy);
        button.addEventListener('click', event => showDetails(paper, event.detail === 0 || matchMedia('(max-width: 767px)').matches));
        section.append(button);
      });
      results.append(section);
    });
    if (visible.length) showDetails(visible.find(p => p.key === state.selected) || visible[0]);
    else {
      detail.hidden = true;
      state.selected = null;
      results.append(make('p', 'publication-browser__empty', 'No matching papers. Try a different search or clear the filters.'));
    }
  };

  [{ id: 'all', label: 'All themes' }, ...themes].forEach(theme => {
    const button = make('button', '', theme.label);
    button.type = 'button';
    button.dataset.theme = theme.id;
    button.style.setProperty('--theme-color', theme.color || 'var(--global-theme-color)');
    button.addEventListener('click', () => { state.theme = theme.id; render(); });
    controls.append(button);
  });
  [...new Set(papers.map(p => p.year))].forEach(year => {
    const option = new Option(String(year), String(year));
    yearSelect.add(option);
  });
  search.addEventListener('input', () => { state.query = search.value.trim().toLowerCase(); render(); });
  explorer.querySelector('[data-publication-back]').addEventListener('click', () => {
    const selected = [...results.querySelectorAll('[data-paper-key]')].find(button => button.dataset.paperKey === state.selected);
    selected?.focus();
  });
  yearSelect.addEventListener('change', () => { state.year = yearSelect.value; render(); });
  explorer.querySelector('[data-publication-clear]').addEventListener('click', () => {
    Object.assign(state, { theme: 'all', year: 'all', query: '' });
    search.value = '';
    yearSelect.value = 'all';
    render();
  });

  const setView = (view, updateUrl = true) => {
    const atlas = view !== 'list';
    document.body.classList.toggle('is-atlas-view', atlas);
    explorer.querySelectorAll('[data-publication-panel]').forEach(panel => {
      panel.hidden = (panel.dataset.publicationPanel === 'atlas') !== atlas;
    });
    explorer.querySelectorAll('[data-publication-view]').forEach(button => {
      const active = (button.dataset.publicationView === 'atlas') === atlas;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (updateUrl) {
      const url = new URL(location.href);
      if (atlas) url.searchParams.delete('view');
      else url.searchParams.set('view', 'list');
      history.replaceState({}, '', url);
    }
  };
  explorer.querySelectorAll('[data-publication-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.publicationView)));
  document.body.classList.add('publication-browser-page');
  const url = new URL(location.href);
  // Publication anchors should open the bibliography, not a hidden list.
  setView(url.searchParams.get('view') === 'list' || url.hash ? 'list' : 'atlas', false);
  render();
})();