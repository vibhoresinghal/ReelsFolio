(() => {
    'use strict';

    const pending = window.ReelFolioLab?._q || [];
    const params = new URLSearchParams(window.location.search);
    const showLab = (params.has('lab') || params.has('controls') || params.has('grid-controls'))
        && !params.has('experiment-preview');

    const queue = [...pending];
    const labs = new Map();
    let zCursor = 22000;
    let menuOpen = false;

    const STYLE_ID = 'reelfolio-lab-shell-styles';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .rf-lab-shell {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 24000;
                font-family: Inter, system-ui, sans-serif;
                color-scheme: dark;
            }

            .rf-lab-fab {
                width: 58px;
                height: 58px;
                border: 0;
                border-radius: 50%;
                color: #f4efe6;
                cursor: pointer;
                background:
                    radial-gradient(circle at 32% 22%, rgba(255, 236, 208, 0.2), transparent 42%),
                    linear-gradient(180deg, #2d5a48 0%, #10281e 100%);
                box-shadow:
                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                    inset 0 -6px 12px rgba(0, 0, 0, 0.28),
                    0 0 0 1px rgba(0, 0, 0, 0.34),
                    -8px 14px 26px rgba(0, 0, 0, 0.38);
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .rf-lab-fab svg { width: 22px; height: 22px; }
            .rf-lab-fab[aria-expanded="true"],
            .rf-lab-fab:hover { color: #fff4df; }

            .rf-lab-menu {
                position: absolute;
                right: 0;
                bottom: 72px;
                width: 268px;
                padding: 10px;
                border-radius: 20px;
                background: rgba(12, 18, 15, 0.96);
                box-shadow:
                    inset 0 1px 0 rgba(255, 255, 255, 0.08),
                    0 18px 40px rgba(0, 0, 0, 0.42);
                display: none;
            }

            .rf-lab-menu.is-open { display: grid; gap: 6px; }

            .rf-lab-menu-label {
                padding: 4px 8px 6px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.42);
            }

            .rf-lab-menu button {
                width: 100%;
                min-height: 56px;
                border: 0;
                border-radius: 14px;
                padding: 10px 12px;
                color: #f6f1ea;
                text-align: left;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.045);
            }

            .rf-lab-menu button:hover { background: rgba(255, 255, 255, 0.09); }
            .rf-lab-menu button.is-open {
                background: rgba(61, 122, 96, 0.28);
                box-shadow: inset 0 0 0 1px rgba(183, 239, 197, 0.18);
            }

            .rf-lab-menu strong {
                display: block;
                font-size: 13px;
                font-weight: 650;
            }

            .rf-lab-menu span {
                display: block;
                margin-top: 2px;
                font-size: 11px;
                line-height: 1.35;
                color: rgba(255, 255, 255, 0.58);
            }

            .rf-lab-window {
                position: fixed;
                width: min(340px, calc(100vw - 24px));
                min-width: 280px;
                min-height: 168px;
                max-width: calc(100vw - 16px);
                max-height: calc(100vh - 16px);
                display: none;
                flex-direction: column;
                overflow: hidden;
                resize: both;
                color: #f6f1ea;
                background: rgba(14, 16, 15, 0.97);
                border-radius: 18px;
                box-shadow:
                    inset 0 1px 0 rgba(255, 255, 255, 0.08),
                    0 0 0 1px rgba(0, 0, 0, 0.28),
                    0 22px 50px rgba(0, 0, 0, 0.45);
            }

            .rf-lab-window.is-open { display: flex; }

            .rf-lab-window-bar {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 10px 10px 12px;
                cursor: grab;
                user-select: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.07);
                background: rgba(255, 255, 255, 0.03);
            }

            .rf-lab-window-bar:active { cursor: grabbing; }

            .rf-lab-grip {
                width: 12px;
                height: 12px;
                opacity: 0.45;
                background:
                    radial-gradient(circle, currentColor 1.1px, transparent 1.2px) 0 0 / 6px 6px,
                    radial-gradient(circle, currentColor 1.1px, transparent 1.2px) 3px 3px / 6px 6px;
            }

            .rf-lab-window-bar h2 {
                flex: 1;
                margin: 0;
                font-size: 13px;
                font-weight: 650;
            }

            .rf-lab-window-bar button {
                width: 28px;
                height: 28px;
                border: 0;
                border-radius: 8px;
                color: inherit;
                background: rgba(255, 255, 255, 0.08);
                cursor: pointer;
            }

            .rf-lab-window-bar button:hover { background: rgba(255, 255, 255, 0.14); }

            .rf-lab-window-body {
                overflow: auto;
                min-height: 0;
                flex: 1;
                overscroll-behavior: contain;
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
            }

            .rf-lab-window-body > * {
                position: static !important;
                inset: auto !important;
                display: block !important;
                width: 100% !important;
                max-width: none !important;
            }

            .rf-lab-window.is-collapsed {
                min-height: 0;
                height: auto !important;
                resize: none;
            }

            .rf-lab-window.is-collapsed .rf-lab-window-body { display: none; }
        `;
        document.head.appendChild(style);
    }

    function closeMenu() {
        const shell = document.querySelector('.rf-lab-shell');
        if (!shell) return;
        menuOpen = false;
        const menu = shell.querySelector('.rf-lab-menu');
        const fab = shell.querySelector('.rf-lab-fab');
        menu.hidden = true;
        menu.classList.remove('is-open');
        fab.setAttribute('aria-expanded', 'false');
    }

    function ensureChrome() {
        if (!showLab || document.querySelector('.rf-lab-shell')) return;
        const shell = document.createElement('div');
        shell.className = 'rf-lab-shell';
        shell.innerHTML = `
            <div class="rf-lab-menu" hidden>
                <div class="rf-lab-menu-label">Controllers</div>
            </div>
            <button class="rf-lab-fab" type="button" aria-expanded="false" aria-label="Open design labs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"></path>
                </svg>
            </button>
        `;
        document.body.appendChild(shell);
        const fab = shell.querySelector('.rf-lab-fab');
        const menu = shell.querySelector('.rf-lab-menu');
        fab.addEventListener('click', () => {
            menuOpen = !menuOpen;
            menu.hidden = !menuOpen;
            menu.classList.toggle('is-open', menuOpen);
            fab.setAttribute('aria-expanded', String(menuOpen));
        });
        document.addEventListener('pointerdown', event => {
            if (!menuOpen) return;
            if (event.target.closest('.rf-lab-shell')) return;
            closeMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenu();
        });
    }

    function bringToFront(win) {
        zCursor += 1;
        win.style.zIndex = String(zCursor);
    }

    function makeDraggable(win, handle) {
        let drag = null;
        handle.addEventListener('pointerdown', event => {
            if (event.target.closest('button')) return;
            bringToFront(win);
            const rect = win.getBoundingClientRect();
            drag = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
            handle.setPointerCapture(event.pointerId);
        });
        handle.addEventListener('pointermove', event => {
            if (!drag) return;
            const x = Math.max(8, Math.min(window.innerWidth - 80, event.clientX - drag.x));
            const y = Math.max(8, Math.min(window.innerHeight - 48, event.clientY - drag.y));
            win.style.left = `${x}px`;
            win.style.top = `${y}px`;
            win.style.right = 'auto';
            win.style.bottom = 'auto';
        });
        handle.addEventListener('pointerup', () => { drag = null; });
        handle.addEventListener('pointercancel', () => { drag = null; });
    }

    function renderMenu() {
        const menu = document.querySelector('.rf-lab-menu');
        if (!menu) return;
        menu.innerHTML = `<div class="rf-lab-menu-label">Controllers</div>` + [...labs.values()].map(lab => `
            <button type="button" data-lab="${lab.id}" class="${lab.window.classList.contains('is-open') ? 'is-open' : ''}">
                <strong>${lab.title}</strong>
                <span>${lab.hint}</span>
            </button>
        `).join('');
        menu.querySelectorAll('[data-lab]').forEach(button => {
            button.addEventListener('click', () => {
                const lab = labs.get(button.dataset.lab);
                if (!lab) return;
                openWindow(lab);
                closeMenu();
            });
        });
    }

    function openWindow(lab) {
        lab.window.classList.add('is-open');
        lab.window.classList.remove('is-collapsed');
        const collapse = lab.window.querySelector('[data-collapse]');
        if (collapse) collapse.textContent = '−';
        bringToFront(lab.window);
        renderMenu();
    }

    function hideInnerChrome(host) {
        const root = host.shadowRoot;
        if (!root) return;
        root.querySelectorAll('.header, .panel > .header').forEach(node => {
            node.style.display = 'none';
        });
    }

    function register(definition) {
        if (!definition?.id || !definition.host) return;
        if (!showLab) {
            definition.host.style.display = 'none';
            return;
        }
        ensureChrome();
        if (labs.has(definition.id)) {
            hideInnerChrome(definition.host);
            return;
        }

        const index = labs.size;
        const win = document.createElement('section');
        win.className = 'rf-lab-window';
        if (definition.id === 'buttons') {
            win.style.right = '20px';
            win.style.top = '20px';
        } else if (definition.id === 'background') {
            win.style.left = window.innerWidth >= 1100 ? '360px' : `${20 + index * 26}px`;
            win.style.top = '20px';
        } else {
            win.style.left = `${20 + index * 26}px`;
            win.style.top = `${20 + index * 34}px`;
        }
        if (definition.width) win.style.width = `${definition.width}px`;
        const windowHeight = definition.height || (definition.id === 'buttons' ? 0 : Math.min(740, window.innerHeight - 24));
        if (windowHeight) win.style.height = `${windowHeight}px`;
        win.innerHTML = `
            <div class="rf-lab-window-bar">
                <span class="rf-lab-grip" aria-hidden="true"></span>
                <h2>${definition.title}</h2>
                <button type="button" data-collapse aria-label="Collapse">−</button>
                <button type="button" data-close aria-label="Close">✕</button>
            </div>
            <div class="rf-lab-window-body"></div>
        `;
        const body = win.querySelector('.rf-lab-window-body');
        definition.host.dataset.labHosted = 'true';
        definition.host.style.cssText = 'position:static;display:block;width:100%;';
        body.appendChild(definition.host);
        hideInnerChrome(definition.host);
        document.body.appendChild(win);

        win.querySelector('[data-close]').addEventListener('click', () => {
            win.classList.remove('is-open');
            renderMenu();
        });
        win.querySelector('[data-collapse]').addEventListener('click', event => {
            const collapsed = win.classList.toggle('is-collapsed');
            event.currentTarget.textContent = collapsed ? '+' : '−';
        });
        win.addEventListener('pointerdown', () => bringToFront(win));
        win.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
        makeDraggable(win, win.querySelector('.rf-lab-window-bar'));

        labs.set(definition.id, {
            id: definition.id,
            title: definition.title,
            hint: definition.hint || 'Open controls',
            window: win
        });
        renderMenu();
        if (definition.autoOpen) openWindow(labs.get(definition.id));
    }

    window.ReelFolioLab = {
        register(definition) {
            if (document.body) register(definition);
            else queue.push(definition);
        },
        open(id) {
            const lab = labs.get(id);
            if (lab) openWindow(lab);
        }
    };

    const flush = () => {
        while (queue.length) register(queue.shift());
    };
    if (document.body) flush();
    else document.addEventListener('DOMContentLoaded', flush);
})();
