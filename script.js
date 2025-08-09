(function(){
  const grid = document.getElementById('grid');
  const refreshBtn = document.getElementById('refreshBtn');
  const aspectBtn = document.getElementById('aspectBtn');

  let data = [];
  let aspect = localStorage.getItem('ig_aspect') || 'square';

  function applyAspect() {
    const isSquare = aspect === 'square';
    document.documentElement.style.setProperty('--tile-aspect', isSquare ? '1 / 1' : '4 / 5');
    aspectBtn.textContent = isSquare ? 'Square' : '4:5';
    aspectBtn.setAttribute('aria-pressed', (!isSquare).toString());
    aspectBtn.title = 'Current: ' + (isSquare ? 'Square' : '4:5');
  }

  aspectBtn.addEventListener('click', () => {
    aspect = aspect === 'square' ? 'fourfive' : 'square';
    localStorage.setItem('ig_aspect', aspect);
    applyAspect();
  });

  async function fetchFeed() {
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = '';
    try {
      const res = await fetch(window.IG_ENDPOINT, { method: 'GET' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      data = Array.isArray(json.posts) ? json.posts : [];
      renderGrid(data);
    } catch (err) {
      console.error('Failed to load feed:', err);
      const errEl = document.createElement('div');
      errEl.style.color = '#f87171';
      errEl.style.padding = '12px';
      errEl.textContent = 'Failed to load feed. Check the endpoint configuration.';
      grid.appendChild(errEl);
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }

  function renderGrid(posts) {
    posts.forEach((p, i) => {
      const tile = document.createElement('div');
      tile.className = 'tile draggable';
      tile.draggable = true;
      tile.tabIndex = 0;
      tile.setAttribute('data-index', i.toString());

      const content = p.link ? document.createElement('a') : document.createElement('div');
      if (p.link) {
        content.href = p.link;
        content.target = '_blank';
        content.rel = 'noopener noreferrer';
      } else {
        content.className = 'no-link';
      }

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = 'Post image';
      img.src = p.image;
      content.appendChild(img);
      tile.appendChild(content);
      grid.appendChild(tile);

      attachDragHandlers(tile);
      attachKeyboardReorder(tile);
    });
  }

  let draggingEl = null;
  let placeholder = null;

  function attachDragHandlers(tile) {
    tile.addEventListener('dragstart', (e) => {
      draggingEl = tile;
      tile.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      const crt = document.createElement('canvas');
      crt.width = crt.height = 0;
      e.dataTransfer.setDragImage(crt, 0, 0);

      placeholder = document.createElement('div');
      placeholder.className = 'tile placeholder';
      placeholder.style.aspectRatio = getComputedStyle(document.documentElement).getPropertyValue('--tile-aspect').trim() || '1 / 1';
      placeholder.style.width = tile.offsetWidth + 'px';
      grid.insertBefore(placeholder, tile.nextSibling);
    });

    tile.addEventListener('dragend', () => {
      if (placeholder) {
        grid.insertBefore(draggingEl, placeholder);
        placeholder.remove();
        placeholder = null;
      }
      draggingEl?.classList.remove('dragging');
      draggingEl = null;
      syncOrderFromDOM();
    });

    grid.addEventListener('dragover', (e) => {
      if (!draggingEl) return;
      e.preventDefault();
      const afterEl = getDragAfterElement(grid, e.clientX, e.clientY);
      if (afterEl == null) {
        grid.appendChild(placeholder);
      } else {
        grid.insertBefore(placeholder, afterEl);
      }
    });
  }

  function getDragAfterElement(container, x, y) {
    const elements = [...container.querySelectorAll('.tile:not(.dragging):not(.placeholder)')];
    let closest = null;
    let closestOffset = Number.NEGATIVE_INFINITY;

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const offset = -(Math.hypot(rect.x + rect.width/2 - x, rect.y + rect.height/2 - y));
      if (offset > closestOffset) {
        closestOffset = offset;
        closest = el;
      }
    });
    return closest;
  }

  function attachKeyboardReorder(tile) {
    tile.addEventListener('keydown', (e) => {
      const index = [...grid.children].indexOf(tile);
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;

      const move = (from, to) => {
        if (to < 0 || to >= grid.children.length) return;
        grid.insertBefore(tile, grid.children[to > from ? to + 1 : to]);
        tile.focus();
        syncOrderFromDOM();
      };

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft': e.preventDefault(); move(index, index - 1); break;
          case 'ArrowRight': e.preventDefault(); move(index, index + 1); break;
          case 'ArrowUp': e.preventDefault(); move(index, index - cols); break;
          case 'ArrowDown': e.preventDefault(); move(index, index + cols); break;
        }
      }
    });
  }

  function syncOrderFromDOM() {
    const tiles = [...grid.querySelectorAll('.tile')];
    const newOrder = tiles.map(t => {
      const idx = parseInt(t.getAttribute('data-index'), 10);
      return data[idx];
    });
    data = newOrder;
  }

  refreshBtn.addEventListener('click', fetchFeed);
  applyAspect();
  fetchFeed();
})();