export function makeDeferred() {
    const deferred = {
        promise: null,
        resolve: null,
        reject: null
    };
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}

// Shared symbol suggestion dropdown for webviews
export function attachSymbolSuggester(inputEls, getSymbols) {
    const container = document.querySelector('.symbol-list');
    if (!container) return { detach() {} };

    function clear() {
        container.innerHTML = '';
        container.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
    }

    function renderMatches(inputEl, filter) {
        while (container.firstChild) container.removeChild(container.firstChild);
        const symbols = getSymbols();
        if (!symbols || !filter) { clear(); return; }
        const lower = filter.toLowerCase();
        const matches = [];
        for (const name of Object.keys(symbols)) {
            if (name.toLowerCase().includes(lower)) matches.push(name);
            if (matches.length >= 20) break;
        }
        if (matches.length === 0) { clear(); return; }

        for (const name of matches) {
            const div = document.createElement('div');
            div.className = 'symbol-list-item';
            div.textContent = `${name} — 0x${symbols[name].toString(16)}`;
            div.dataset.name = name;
            div.addEventListener('mousedown', (e) => { e.preventDefault(); inputEl.value = name; clear(); inputEl.focus(); });
            container.appendChild(div);
        }

        // Position relative to viewport to avoid iframe scrollbars
        const rect = inputEl.getBoundingClientRect();
        const viewportW = window.innerWidth || document.documentElement.clientWidth;
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const desiredWidth = viewportW - 8;
        const maxAllowed = 240;
        const availableBelow = Math.max(0, viewportH - rect.bottom - 8);
        const availableAbove = Math.max(0, rect.top - 8);
        const placeAbove = (availableBelow < 80 && availableAbove > availableBelow);
        let usedMaxHeight = placeAbove ? Math.min(availableAbove, maxAllowed) : Math.min(availableBelow, maxAllowed);
        if (usedMaxHeight < 40) usedMaxHeight = Math.min(maxAllowed, Math.max(availableBelow, availableAbove));

        let left = rect.left;
        if (left + desiredWidth > viewportW - 8) left = Math.max(8, viewportW - desiredWidth - 8);
        container.style.left = `${left}px`;
        if (placeAbove) {
            container.style.top = '';
            container.style.bottom = `${viewportH - rect.top}px`;
        } else {
            container.style.bottom = '';
            container.style.top = `${rect.bottom}px`;
        }
        container.style.maxWidth = `${desiredWidth}px`;
        container.style.maxHeight = `${usedMaxHeight}px`;
        container.style.display = 'block';
        container.removeAttribute('aria-hidden');
    }

    function onInput(e) { renderMatches(e.target, e.target.value); }
    function onBlur() { setTimeout(() => clear(), 150); }
    function onKeydown(e) {
        const active = container.querySelector('.symbol-list-item.active');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const items = Array.from(container.querySelectorAll('.symbol-list-item'));
            if (items.length === 0) return;
            let idx = active ? items.indexOf(active) : -1;
            if (e.key === 'ArrowDown') idx = Math.min(items.length - 1, idx + 1);
            else idx = Math.max(0, idx - 1);
            if (active) active.classList.remove('active');
            items[idx].classList.add('active');
            items[idx].scrollIntoView({ block: 'nearest' });
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (active) {
                const inputEl = e.target;
                inputEl.value = active.dataset.name;
                clear();
                e.preventDefault();
            }
        } else if (e.key === 'Escape') {
            clear();
        }
    }

    const listeners = [];
    for (const inputEl of inputEls) {
        inputEl.addEventListener('input', onInput);
        inputEl.addEventListener('blur', onBlur);
        inputEl.addEventListener('keydown', onKeydown);
        listeners.push({ el: inputEl, onInput, onBlur, onKeydown });
    }

    return {
        detach() {
            for (const l of listeners) {
                l.el.removeEventListener('input', l.onInput);
                l.el.removeEventListener('blur', l.onBlur);
                l.el.removeEventListener('keydown', l.onKeydown);
            }
            clear();
        },
        show(inputEl, value) { renderMatches(inputEl, value); },
        clear
    };
}
