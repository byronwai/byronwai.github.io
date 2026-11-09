/* 錯題簿 — progressive enhancements. No dependencies. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      var m = $('meta[name="theme-color"]');
      if (m) m.setAttribute('content', next === 'dark' ? '#0b0b0f' : '#fafafa');
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-toggle');
  var nav = $('#site-nav');
  if (menuBtn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setMenu(!nav.classList.contains('open'));
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- Scroll: header border, progress bar, back-to-top ---------- */
  var header = $('.site-header');
  var progress = $('.read-progress');
  var toTop = $('#back-to-top');
  var article = $('.post-content');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('visible', y > 600);
    if (progress && article) {
      var start = article.offsetTop;
      var end = start + article.offsetHeight - window.innerHeight;
      var p = end > start ? (y - start) / (end - start) : 1;
      progress.style.setProperty('--progress', Math.min(1, Math.max(0, p)).toFixed(4));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Card reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var cards = $$('.post-grid .card');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    cards.forEach(function (c) {
      // Cards already on screen at load shouldn't flash.
      if (c.getBoundingClientRect().top < window.innerHeight) return;
      c.classList.add('reveal');
      io.observe(c);
    });
  }

  /* ---------- Home: tag filter ---------- */
  var filter = $('#tag-filter');
  var grid = $('#post-grid');
  if (filter && grid) {
    var gridCards = $$('.card', grid);
    var counts = {};
    gridCards.forEach(function (c) {
      (c.getAttribute('data-tags') || '').split('|').forEach(function (t) {
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    var top = Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); })
      .slice(0, 8);

    if (top.length) {
      var makeChip = function (label, value) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'filter-chip';
        b.textContent = label;
        b.setAttribute('data-value', value);
        b.setAttribute('aria-pressed', value === '' ? 'true' : 'false');
        filter.appendChild(b);
      };
      makeChip('全部', '');
      top.forEach(function (t) { makeChip(t, t); });
      filter.hidden = false;

      var empty = $('#grid-empty');
      filter.addEventListener('click', function (e) {
        var chip = e.target.closest('.filter-chip');
        if (!chip) return;
        var value = chip.getAttribute('data-value');
        $$('.filter-chip', filter).forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });
        var shown = 0;
        gridCards.forEach(function (c) {
          var tags = (c.getAttribute('data-tags') || '').split('|');
          var match = !value || tags.indexOf(value) !== -1;
          c.hidden = !match;
          if (match) { shown++; c.classList.add('in'); }
        });
        grid.classList.toggle('is-filtered', !!value);
        if (empty) empty.hidden = shown > 0;
      });
    }
  }

  /* ---------- Post: headings, TOC, code blocks, images ---------- */
  if (article) {
    var slugCounts = {};
    var slugify = function (s) {
      var base = s.trim().toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'section';
      var n = slugCounts[base] = (slugCounts[base] || 0) + 1;
      return n > 1 ? base + '-' + n : base;
    };

    var headings = $$('h2, h3', article);
    headings.forEach(function (h) {
      if (!h.id || /^section(-\d+)?$/.test(h.id)) h.id = slugify(h.textContent);
      var a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', '連結到此段落');
      a.textContent = '#';
      h.insertBefore(a, h.firstChild);
    });

    var toc = $('#toc');
    if (toc && headings.length >= 3) {
      var tocNav = $('.toc-nav', toc);
      var links = headings.map(function (h) {
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.className = 'lvl-' + h.tagName.charAt(1);
        a.textContent = h.textContent.replace(/^#/, '').trim();
        tocNav.appendChild(a);
        return a;
      });
      toc.hidden = false;
      if (window.innerWidth < 1200) $('details', toc).removeAttribute('open');

      // Scroll-spy
      var spy = function () {
        var current = 0;
        var line = window.innerHeight * 0.25;
        headings.forEach(function (h, i) {
          if (h.getBoundingClientRect().top < line) current = i;
        });
        links.forEach(function (l, i) { l.classList.toggle('active', i === current); });
      };
      var spyTick = false;
      window.addEventListener('scroll', function () {
        if (!spyTick) { spyTick = true; requestAnimationFrame(function () { spy(); spyTick = false; }); }
      }, { passive: true });
      spy();
    }

    // Code blocks: language label + copy button.
    $$('div.highlighter-rouge', article).forEach(function (block) {
      var pre = $('pre', block);
      if (!pre) return;
      var m = block.className.match(/language-([\w+#-]+)/);
      var lang = m && m[1] !== 'plaintext' ? m[1] : 'text';
      var head = document.createElement('div');
      head.className = 'code-head';
      head.innerHTML = '<span></span><button type="button" class="copy-btn" aria-label="複製程式碼">複製</button>';
      head.firstChild.textContent = lang;
      var hl = $('.highlight', block) || block;
      hl.insertBefore(head, hl.firstChild);
      var btn = $('.copy-btn', head);
      btn.addEventListener('click', function () {
        var text = pre.innerText.replace(/\n$/, '');
        var done = function () {
          btn.textContent = '已複製 ✓';
          btn.classList.add('copied');
          setTimeout(function () { btn.textContent = '複製'; btn.classList.remove('copied'); }, 1600);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
      });
    });

    // Image lightbox (skip images that are already links).
    $$('img', article).forEach(function (img) {
      if (img.closest('a')) return;
      img.classList.add('zoomable');
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      img.addEventListener('click', function () {
        var box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', img.alt || '圖片');
        var big = document.createElement('img');
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        box.appendChild(big);
        var close = function () {
          box.remove();
          document.removeEventListener('keydown', onKey);
        };
        var onKey = function (e) { if (e.key === 'Escape') close(); };
        box.addEventListener('click', close);
        document.addEventListener('keydown', onKey);
        document.body.appendChild(box);
      });
    });
  }

  /* ---------- Copy page link ---------- */
  $$('[data-copy-link]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(location.href.split('#')[0]).then(function () {
        var label = $('span', btn);
        var old = label.textContent;
        label.textContent = '已複製 ✓';
        setTimeout(function () { label.textContent = old; }, 1600);
      });
    });
  });

  /* ---------- Search ---------- */
  var modal = $('#search-modal');
  if (modal) {
    var input = $('#search-input');
    var list = $('#search-results');
    var index = null;
    var loading = null;
    var sel = 0;
    var lastFocus = null;

    var loadIndex = function () {
      if (index || loading) return loading;
      loading = fetch(modal.getAttribute('data-index'))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          index = data.map(function (d) {
            d._t = d.title.toLowerCase();
            d._g = (d.tags || []).join(' ').toLowerCase();
            d._c = (d.content || '').toLowerCase();
            return d;
          });
        });
      return loading;
    };

    var escapeHtml = function (s) {
      return s.replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };
    var highlight = function (text, terms) {
      var out = escapeHtml(text);
      terms.forEach(function (t) {
        var re = new RegExp('(' + escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    };

    var render = function () {
      var q = input.value.trim().toLowerCase();
      list.innerHTML = '';
      sel = 0;
      if (!q || !index) return;
      var terms = q.split(/\s+/).filter(Boolean);
      var results = [];
      index.forEach(function (d) {
        var score = 0;
        for (var i = 0; i < terms.length; i++) {
          var t = terms[i];
          var s = 0;
          if (d._t.indexOf(t) !== -1) s += 10;
          if (d._g.indexOf(t) !== -1) s += 6;
          if (d._c.indexOf(t) !== -1) s += 1;
          if (!s) return;
          score += s;
        }
        results.push({ d: d, score: score });
      });
      results.sort(function (a, b) { return b.score - a.score || (a.d.date < b.d.date ? 1 : -1); });

      if (!results.length) {
        list.innerHTML = '<li class="sr-empty">找不到相關文章</li>';
        return;
      }
      results.slice(0, 12).forEach(function (r, i) {
        var d = r.d;
        var pos = d._c.indexOf(terms[0]);
        var snippet = '';
        if (pos !== -1) {
          var from = Math.max(0, pos - 40);
          snippet = (from > 0 ? '…' : '') + d.content.substr(from, 160);
        } else {
          snippet = d.content.substr(0, 140);
        }
        var li = document.createElement('li');
        li.innerHTML =
          '<a href="' + d.url + '" role="option" aria-selected="' + (i === 0) + '">' +
          '<span class="sr-title">' + highlight(d.title, terms) + '</span>' +
          '<span class="sr-meta">' + d.date + (d.tags && d.tags.length ? ' · ' + escapeHtml(d.tags.join(', ')) : '') + '</span>' +
          '<span class="sr-snippet">' + highlight(snippet, terms) + '</span></a>';
        list.appendChild(li);
      });
    };

    var move = function (delta) {
      var items = $$('a', list);
      if (!items.length) return;
      sel = (sel + delta + items.length) % items.length;
      items.forEach(function (a, i) { a.setAttribute('aria-selected', String(i === sel)); });
      items[sel].scrollIntoView({ block: 'nearest' });
    };

    var open = function () {
      if (!modal.hidden) return;
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      input.focus();
      input.select();
      var p = loadIndex();
      if (p) p.then(render);
    };
    var close = function () {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    $$('[data-search-open]').forEach(function (b) { b.addEventListener('click', open); });
    $$('[data-search-close]', modal).forEach(function (b) { b.addEventListener('click', close); });
    input.addEventListener('input', render);

    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        modal.hidden ? open() : close();
        return;
      }
      if (e.key === '/' && !typing && modal.hidden) {
        e.preventDefault();
        open();
        return;
      }
      if (modal.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var target = $$('a', list)[sel];
        if (target) { e.preventDefault(); location.href = target.href; }
      }
    });

    // Show ⌘K on Apple devices.
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
      $$('kbd').forEach(function (k) { k.textContent = k.textContent.replace('Ctrl K', '⌘K'); });
    }
  }
})();
