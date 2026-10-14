(() => {
  const explorer = document.querySelector('[data-publication-explorer]');
  const dataElement = document.querySelector('#publication-atlas-data');

  if (!explorer || !dataElement || typeof window.d3 === 'undefined') return;

  const atlasData = JSON.parse(dataElement.textContent);
  const themes = Object.entries(atlasData.themes).map(([id, theme]) => ({ id, ...theme }));
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));
  const rows = [...explorer.querySelectorAll('[data-publication]')];
  const publications = rows.map((row) => {
    const key = row.dataset.key;
    const metadata = atlasData.papers[key] || { theme: 'trustworthy' };
    const links = [...row.querySelectorAll('.links a[href]')].map((link) => ({
      href: link.href,
      label: link.textContent.trim()
    }));

    return {
      key,
      row,
      year: Number(row.dataset.year),
      type: row.dataset.type,
      theme: metadata.theme,
      title: row.querySelector('.title')?.textContent.trim() || key,
      authors: row.querySelector('.author')?.textContent.replace(/\s+/g, ' ').trim() || '',
      authorsHtml: row.querySelector('.author')?.innerHTML || '',
      venue: row.querySelector('.periodical')?.textContent.replace(/\s+/g, ' ').trim() || '',
      abstract: row.querySelector('.abstract.hidden p')?.textContent.trim() || '',
      links
    };
  }).sort((first, second) => first.year - second.year || first.title.localeCompare(second.title));

  const panels = {
    atlas: explorer.querySelector('[data-publication-panel="atlas"]'),
    list: explorer.querySelector('[data-publication-panel="list"]')
  };
  const viewButtons = [...explorer.querySelectorAll('[data-publication-view]')];
  const searchInput = explorer.querySelector('[data-publication-search]');
  const themeControls = explorer.querySelector('[data-publication-themes]');
  const countElement = explorer.querySelector('[data-publication-count]');
  const traceButton = explorer.querySelector('[data-publication-trace]');
  const resetButton = explorer.querySelector('[data-publication-reset]');
  const tooltip = explorer.querySelector('[data-publication-tooltip]');
  const canvas = explorer.querySelector('[data-publication-canvas]');
  const svg = window.d3.select(explorer.querySelector('[data-publication-svg]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = 1120;
  const height = 590;
  const margin = { top: 70, right: 45, bottom: 48, left: 270 };
  const years = [...new Set(publications.map((publication) => publication.year))].sort();
  let activeTheme = 'all';
  let query = '';
  let selectedKey = null;

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  const plot = svg.append('g').attr('class', 'atlas-plot');
  const x = window.d3.scalePoint().domain(years).range([margin.left, width - margin.right]).padding(0.35);
  const y = window.d3.scalePoint().domain(themes.map((theme) => theme.id)).range([margin.top + 35, height - margin.bottom]).padding(0.3);

  const buckets = window.d3.group(publications, (publication) => `${publication.theme}-${publication.year}`);
  buckets.forEach((bucket) => {
    bucket.forEach((publication, index) => {
      const angle = (index / Math.max(bucket.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = bucket.length > 1 ? 16 + Math.floor(index / 7) * 10 : 0;
      publication.x = x(publication.year) + Math.cos(angle) * radius;
      publication.y = y(publication.theme) + Math.sin(angle) * radius;
    });
  });

  plot.selectAll('.atlas-year-line')
    .data(years)
    .join('line')
    .attr('class', 'atlas-year-line')
    .attr('x1', (year) => x(year))
    .attr('x2', (year) => x(year))
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom + 15);

  plot.selectAll('.atlas-year-label')
    .data(years)
    .join('text')
    .attr('class', 'atlas-year-label')
    .attr('x', (year) => x(year))
    .attr('y', margin.top - 22)
    .text((year) => year);

  plot.selectAll('.atlas-lane-line')
    .data(themes)
    .join('line')
    .attr('class', 'atlas-lane-line')
    .attr('x1', margin.left - 12)
    .attr('x2', width - margin.right + 12)
    .attr('y1', (theme) => y(theme.id))
    .attr('y2', (theme) => y(theme.id));

  plot.selectAll('.atlas-lane-label')
    .data(themes)
    .join('text')
    .attr('class', 'atlas-lane-label')
    .attr('x', margin.left - 24)
    .attr('y', (theme) => y(theme.id) + 5)
    .attr('fill', (theme) => theme.color)
    .text((theme) => theme.label);

  const line = window.d3.line().x((publication) => publication.x).y((publication) => publication.y).curve(window.d3.curveMonotoneX);
  const threads = plot.selectAll('.atlas-thread')
    .data(themes)
    .join('path')
    .attr('class', 'atlas-thread')
    .attr('data-theme', (theme) => theme.id)
    .attr('stroke', (theme) => theme.color)
    .attr('d', (theme) => line(publications.filter((publication) => publication.theme === theme.id)));

  const symbolFor = (type) => {
    if (type === 'article') return window.d3.symbolCircle;
    if (type === 'inproceedings') return window.d3.symbolSquare;
    return window.d3.symbolDiamond;
  };

  const nodes = plot.selectAll('.atlas-node')
    .data(publications)
    .join('g')
    .attr('class', 'atlas-node')
    .attr('data-key', (publication) => publication.key)
    .attr('role', 'button')
    .attr('tabindex', 0)
    .attr('aria-label', (publication) => `${publication.title}, ${publication.year}`)
    .attr('transform', (publication) => `translate(${publication.x},${publication.y})`);

  nodes.append('path')
    .attr('d', (publication) => window.d3.symbol().type(symbolFor(publication.type)).size(135)())
    .attr('fill', (publication) => themeById.get(publication.theme).color);

  const zoom = window.d3.zoom()
    .scaleExtent([0.8, 3])
    .on('zoom', (event) => plot.attr('transform', event.transform));
  svg.call(zoom).on('dblclick.zoom', null);

  const setView = (view, updateUrl = true) => {
    const resolvedView = view === 'list' ? 'list' : 'atlas';
    document.body.classList.toggle('is-atlas-view', resolvedView === 'atlas');
    Object.entries(panels).forEach(([name, panel]) => {
      panel.hidden = name !== resolvedView;
    });
    viewButtons.forEach((button) => {
      const active = button.dataset.publicationView === resolvedView;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (resolvedView === 'list') url.searchParams.set('view', 'list');
      else url.searchParams.delete('view');
      window.history.replaceState({}, '', url);
    }
  };

  const showDetails = (publication) => {
    selectedKey = publication.key;
    const theme = themeById.get(publication.theme);
    const detail = explorer.querySelector('[data-publication-detail]');
    detail.style.setProperty('--detail-color', theme.color);
    detail.querySelector('[data-detail-theme]').textContent = theme.label;
    detail.querySelector('[data-detail-title]').textContent = publication.title;
    detail.querySelector('[data-detail-meta]').textContent = [publication.year, publication.venue].filter(Boolean).join(' · ');
    detail.querySelector('[data-detail-authors]').innerHTML = publication.authorsHtml;
    detail.querySelector('[data-detail-abstract]').textContent = publication.abstract || 'Abstract unavailable.';
    const linksElement = detail.querySelector('[data-detail-links]');
    linksElement.replaceChildren(...publication.links.map((link) => {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (new URL(link.href, window.location.href).origin !== window.location.origin) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      return anchor;
    }));
    nodes.classed('is-selected', (candidate) => candidate.key === publication.key);
  };

  const matchesFilters = (publication) => {
    const matchesTheme = activeTheme === 'all' || publication.theme === activeTheme;
    const haystack = `${publication.title} ${publication.authors} ${publication.venue} ${publication.year}`.toLowerCase();
    return matchesTheme && haystack.includes(query);
  };

  const updateFilters = () => {
    const visible = publications.filter(matchesFilters);
    nodes
      .style('opacity', (publication) => matchesFilters(publication) ? 1 : 0.08)
      .style('pointer-events', (publication) => matchesFilters(publication) ? 'auto' : 'none')
      .attr('aria-hidden', (publication) => String(!matchesFilters(publication)));
    threads.style('opacity', (theme) => activeTheme === 'all' || activeTheme === theme.id ? 0.42 : 0.04);
    countElement.textContent = visible.length
      ? `${visible.length} of ${publications.length} publications`
      : 'No publications match these filters';
    if (!visible.some((publication) => publication.key === selectedKey) && visible.length) showDetails(visible[visible.length - 1]);
  };

  const themeButtons = [{ id: 'all', label: 'All', color: 'var(--atlas-ink)' }, ...themes].map((theme) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = theme.label;
    button.style.setProperty('--theme-color', theme.color);
    button.classList.toggle('is-active', theme.id === 'all');
    button.addEventListener('click', () => {
      activeTheme = theme.id;
      themeControls.querySelectorAll('button').forEach((control) => control.classList.toggle('is-active', control === button));
      updateFilters();
    });
    return button;
  });
  themeControls.replaceChildren(...themeButtons);

  nodes
    .on('click', (_, publication) => showDetails(publication))
    .on('keydown', (event, publication) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showDetails(publication);
      }
    })
    .on('pointerenter', (event, publication) => {
      tooltip.textContent = `${publication.title} · ${publication.year}`;
      tooltip.classList.add('is-visible');
      const bounds = canvas.getBoundingClientRect();
      tooltip.style.left = `${event.clientX - bounds.left}px`;
      tooltip.style.top = `${event.clientY - bounds.top}px`;
    })
    .on('pointermove', (event) => {
      const bounds = canvas.getBoundingClientRect();
      tooltip.style.left = `${event.clientX - bounds.left}px`;
      tooltip.style.top = `${event.clientY - bounds.top}px`;
    })
    .on('pointerleave', () => tooltip.classList.remove('is-visible'));

  viewButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.publicationView)));
  searchInput.addEventListener('input', () => {
    query = searchInput.value.trim().toLowerCase();
    updateFilters();
  });
  resetButton.addEventListener('click', () => svg.transition().duration(reducedMotion ? 0 : 350).call(zoom.transform, window.d3.zoomIdentity));
  traceButton.addEventListener('click', () => {
    activeTheme = 'all';
    query = '';
    searchInput.value = '';
    themeButtons.forEach((button, index) => button.classList.toggle('is-active', index === 0));
    if (reducedMotion) {
      updateFilters();
      return;
    }
    traceButton.disabled = true;
    nodes.interrupt().style('opacity', 0).transition().duration(300).delay((publication) => (publication.year - years[0]) * 260).style('opacity', 1);
    threads.each(function () {
      const path = window.d3.select(this);
      const length = this.getTotalLength();
      path.attr('stroke-dasharray', `${length} ${length}`).attr('stroke-dashoffset', length)
        .transition().duration(1800).attr('stroke-dashoffset', 0)
        .on('end', () => path.attr('stroke-dasharray', null).attr('stroke-dashoffset', null));
    });
    window.setTimeout(() => {
      traceButton.disabled = false;
      updateFilters();
    }, 2100);
  });

  const initialView = new URL(window.location.href).searchParams.get('view') === 'list' ? 'list' : 'atlas';
  setView(initialView, false);
  showDetails(publications.find((publication) => publication.key === 'morrison2026wavelengthai') || publications[publications.length - 1]);
  updateFilters();
})();