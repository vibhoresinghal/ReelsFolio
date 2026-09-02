(() => {
    'use strict';

    if (document.getElementById('reelfolio-grid-controller')) return;

    const ROOT = document.documentElement;
    const STYLE_ID = 'reelfolio-grid-experiment-styles';
    const HOST_ID = 'reelfolio-grid-controller';
    const searchParams = new URLSearchParams(window.location.search);
    const showController = searchParams.has('grid-controls') && !searchParams.has('experiment-preview');
    const defaults = {
        pattern: 'cutting-mat',
        color: '#f2dbcf',
        spacing: 28,
        thickness: 1,
        opacity: 14,
        majorEvery: 6,
        majorOpacity: 42,
        edgeTicks: true,
        numericGuides: true,
        radiusGuides: true,
        angleGuides: true,
        angleStep: 30,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        blur: 0,
        blend: 'soft-light',
        fade: false,
        grainEnabled: true,
        grainOpacity: 37,
        grainSize: 215,
        grainContrast: 105,
        grainBlend: 'soft-light'
    };
    const state = { ...defaults };

    const experimentStyle = document.createElement('style');
    experimentStyle.id = STYLE_ID;
    experimentStyle.textContent = `
        .bg-layer::after {
            content: '';
            position: absolute;
            inset: -50%;
            z-index: 1;
            pointer-events: none;
            opacity: var(--bg-grid-opacity);
            background-position: var(--bg-grid-offset-x) var(--bg-grid-offset-y);
            transform: rotate(var(--bg-grid-rotation));
            transform-origin: center;
            filter: blur(var(--bg-grid-blur));
            mix-blend-mode: var(--bg-grid-blend);
            transition: opacity 180ms ease;
            will-change: transform, background-position;
        }

        :root[data-bg-grid-pattern="none"] .bg-layer::after {
            opacity: 0;
        }

        :root[data-bg-grid-pattern="cutting-mat"] .bg-layer::after {
            opacity: 0;
        }

        :root[data-bg-grid-pattern="square"] .bg-layer::after {
            background-image:
                linear-gradient(
                    to right,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness)
                ),
                linear-gradient(
                    to bottom,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness)
                );
            background-size: var(--bg-grid-spacing) var(--bg-grid-spacing);
        }

        :root[data-bg-grid-pattern="dots"] .bg-layer::after {
            background-image: radial-gradient(
                circle,
                rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                transparent calc(var(--bg-grid-thickness) + 0.6px)
            );
            background-size: var(--bg-grid-spacing) var(--bg-grid-spacing);
        }

        :root[data-bg-grid-pattern="diagonal"] .bg-layer::after {
            background-image: repeating-linear-gradient(
                45deg,
                rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                transparent var(--bg-grid-thickness) var(--bg-grid-spacing)
            );
        }

        :root[data-bg-grid-pattern="crosshatch"] .bg-layer::after {
            background-image:
                repeating-linear-gradient(
                    45deg,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness) var(--bg-grid-spacing)
                ),
                repeating-linear-gradient(
                    -45deg,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness) var(--bg-grid-spacing)
                );
        }

        :root[data-bg-grid-pattern="isometric"] .bg-layer::after {
            background-image:
                linear-gradient(
                    30deg,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness)
                ),
                linear-gradient(
                    -30deg,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness)
                ),
                linear-gradient(
                    90deg,
                    rgb(var(--bg-grid-rgb)) 0 var(--bg-grid-thickness),
                    transparent var(--bg-grid-thickness)
                );
            background-size:
                calc(var(--bg-grid-spacing) * 2) var(--bg-grid-spacing),
                calc(var(--bg-grid-spacing) * 2) var(--bg-grid-spacing),
                calc(var(--bg-grid-spacing) * 2) var(--bg-grid-spacing);
        }

        .bg-grid-cutting-mat {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            pointer-events: none;
            transform:
                translate(var(--bg-grid-offset-x), var(--bg-grid-offset-y))
                rotate(var(--bg-grid-rotation));
            transform-origin: center;
            filter: blur(var(--bg-grid-blur));
            mix-blend-mode: var(--bg-grid-blend);
        }

        :root:not([data-bg-grid-pattern="cutting-mat"]) .bg-grid-cutting-mat {
            display: none;
        }

        :root[data-bg-grid-fade] .bg-layer::after,
        :root[data-bg-grid-fade] .bg-grid-cutting-mat {
            mask-image: radial-gradient(
                ellipse at center,
                black 20%,
                rgba(0, 0, 0, 0.75) 58%,
                transparent 82%
            );
            -webkit-mask-image: radial-gradient(
                ellipse at center,
                black 20%,
                rgba(0, 0, 0, 0.75) 58%,
                transparent 82%
            );
        }
    `;
    document.head.appendChild(experimentStyle);

    const bgLayer = document.getElementById('bgLayer');
    const cuttingMatSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    cuttingMatSvg.classList.add('bg-grid-cutting-mat');
    cuttingMatSvg.setAttribute('aria-hidden', 'true');
    if (bgLayer) bgLayer.appendChild(cuttingMatSvg);

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = `position:fixed;left:16px;top:16px;z-index:20000;${showController ? '' : 'display:none;'}`;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
        <style>
            :host { color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
            * { box-sizing: border-box; }
            .panel {
                width: 300px;
                max-height: calc(100vh - 32px);
                overflow: auto;
                color: #f6f6f8;
                background: rgba(17, 18, 23, 0.94);
                border: 1px solid rgba(255,255,255,0.13);
                border-radius: 16px;
                box-shadow: 0 18px 60px rgba(0,0,0,0.45);
                backdrop-filter: blur(18px);
            }
            .header {
                position: sticky;
                top: 0;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 15px;
                background: rgba(17, 18, 23, 0.96);
                border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            h2 { margin: 0; font-size: 14px; letter-spacing: -0.01em; }
            .collapse {
                width: 28px;
                height: 28px;
                border: 0;
                border-radius: 8px;
                color: inherit;
                background: rgba(255,255,255,0.09);
                cursor: pointer;
            }
            .content { padding: 14px; display: grid; gap: 14px; }
            .panel.collapsed { width: 190px; overflow: hidden; }
            .panel.collapsed .content { display: none; }
            label, .label { font-size: 12px; color: rgba(255,255,255,0.72); }
            .row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 6px;
            }
            output { font-size: 11px; color: #b8adff; font-variant-numeric: tabular-nums; }
            select, input[type="color"] {
                height: 34px;
                color: inherit;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 9px;
            }
            select { width: 150px; padding: 0 9px; }
            input[type="color"] { width: 46px; padding: 3px; }
            input[type="range"] { width: 100%; accent-color: #8b7cff; }
            .toggle { display: flex; align-items: center; justify-content: space-between; }
            .subsection {
                display: grid;
                gap: 12px;
                padding: 12px;
                border: 1px solid rgba(255,255,255,0.09);
                border-radius: 12px;
                background: rgba(255,255,255,0.035);
            }
            .subsection[hidden] { display: none; }
            .subsection-title { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9); }
            .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .action {
                height: 36px;
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 10px;
                color: inherit;
                background: rgba(255,255,255,0.08);
                cursor: pointer;
            }
            .action.primary { background: #7667e8; border-color: #8b7cff; }
            .status { min-height: 16px; margin: 0; font-size: 11px; color: #b7efc5; }
        </style>
        <section class="panel" aria-label="Background grid experiment controller">
            <div class="header">
                <h2>Background grid lab</h2>
                <button class="collapse" type="button" aria-label="Collapse controller">−</button>
            </div>
            <div class="content">
                <div class="row">
                    <label for="grid-pattern">Pattern</label>
                    <select id="grid-pattern" data-property="pattern">
                        <option value="none">None</option>
                        <option value="cutting-mat" selected>Cutting mat</option>
                        <option value="square">Square</option>
                        <option value="dots">Dots</option>
                        <option value="diagonal">Diagonal</option>
                        <option value="crosshatch">Crosshatch</option>
                        <option value="isometric">Isometric</option>
                    </select>
                </div>
                <div class="row">
                    <label for="grid-color">Color</label>
                    <input id="grid-color" type="color" value="#ffffff" data-property="color">
                </div>
                <div>
                    <div class="row"><label for="grid-spacing">Spacing</label><output data-output="spacing">28px</output></div>
                    <input id="grid-spacing" type="range" min="8" max="120" step="1" value="28" data-property="spacing">
                </div>
                <div>
                    <div class="row"><label for="grid-thickness">Thickness</label><output data-output="thickness">1px</output></div>
                    <input id="grid-thickness" type="range" min="0.25" max="5" step="0.25" value="1" data-property="thickness">
                </div>
                <div>
                    <div class="row"><label for="grid-opacity">Minor grid opacity</label><output data-output="opacity">13%</output></div>
                    <input id="grid-opacity" type="range" min="0" max="70" step="1" value="13" data-property="opacity">
                </div>
                <div class="subsection" data-cutting-controls>
                    <span class="subsection-title">Cutting mat guides</span>
                    <div>
                        <div class="row"><label for="grid-major-every">Major line interval</label><output data-output="majorEvery">5</output></div>
                        <input id="grid-major-every" type="range" min="2" max="10" step="1" value="5" data-property="majorEvery">
                    </div>
                    <div>
                        <div class="row"><label for="grid-major-opacity">Major opacity</label><output data-output="majorOpacity">27%</output></div>
                        <input id="grid-major-opacity" type="range" min="0" max="80" step="1" value="27" data-property="majorOpacity">
                    </div>
                    <label class="toggle"><span class="label">Edge ticks</span><input type="checkbox" checked data-property="edgeTicks"></label>
                    <label class="toggle"><span class="label">Numeric guides</span><input type="checkbox" checked data-property="numericGuides"></label>
                    <label class="toggle"><span class="label">Radius guides</span><input type="checkbox" checked data-property="radiusGuides"></label>
                    <label class="toggle"><span class="label">Angle guides</span><input type="checkbox" checked data-property="angleGuides"></label>
                    <div class="row">
                        <label for="grid-angle-step">Angle spacing</label>
                        <select id="grid-angle-step" data-property="angleStep">
                            <option value="5">5°</option>
                            <option value="10">10°</option>
                            <option value="15" selected>15°</option>
                            <option value="30">30°</option>
                        </select>
                    </div>
                </div>
                <div>
                    <div class="row"><label for="grid-rotation">Rotation</label><output data-output="rotation">0°</output></div>
                    <input id="grid-rotation" type="range" min="-45" max="45" step="1" value="0" data-property="rotation">
                </div>
                <div>
                    <div class="row"><label for="grid-offset-x">Horizontal offset</label><output data-output="offsetX">0px</output></div>
                    <input id="grid-offset-x" type="range" min="-120" max="120" step="1" value="0" data-property="offsetX">
                </div>
                <div>
                    <div class="row"><label for="grid-offset-y">Vertical offset</label><output data-output="offsetY">0px</output></div>
                    <input id="grid-offset-y" type="range" min="-120" max="120" step="1" value="0" data-property="offsetY">
                </div>
                <div>
                    <div class="row"><label for="grid-blur">Blur</label><output data-output="blur">0px</output></div>
                    <input id="grid-blur" type="range" min="0" max="10" step="0.5" value="0" data-property="blur">
                </div>
                <div class="row">
                    <label for="grid-blend">Blend mode</label>
                    <select id="grid-blend" data-property="blend">
                        <option value="normal">Normal</option>
                        <option value="soft-light" selected>Soft light</option>
                        <option value="overlay">Overlay</option>
                        <option value="screen">Screen</option>
                        <option value="multiply">Multiply</option>
                    </select>
                </div>
                <label class="toggle">
                    <span class="label">Fade toward edges</span>
                    <input type="checkbox" checked data-property="fade">
                </label>
                <div class="subsection">
                    <span class="subsection-title">Grain adjustment layer</span>
                    <label class="toggle">
                        <span class="label">Enable grain</span>
                        <input type="checkbox" checked data-property="grainEnabled">
                    </label>
                    <div>
                        <div class="row"><label for="grain-opacity">Amount</label><output data-output="grainOpacity">37%</output></div>
                        <input id="grain-opacity" type="range" min="0" max="40" step="1" value="37" data-property="grainOpacity">
                    </div>
                    <div>
                        <div class="row"><label for="grain-size">Texture scale</label><output data-output="grainSize">215px</output></div>
                        <input id="grain-size" type="range" min="40" max="400" step="5" value="215" data-property="grainSize">
                    </div>
                    <div>
                        <div class="row"><label for="grain-contrast">Contrast</label><output data-output="grainContrast">105%</output></div>
                        <input id="grain-contrast" type="range" min="50" max="220" step="5" value="105" data-property="grainContrast">
                    </div>
                    <div class="row">
                        <label for="grain-blend">Blend mode</label>
                        <select id="grain-blend" data-property="grainBlend">
                            <option value="normal">Normal</option>
                            <option value="soft-light" selected>Soft light</option>
                            <option value="overlay">Overlay</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                        </select>
                    </div>
                </div>
                <div class="actions">
                    <button class="action primary" type="button" data-copy>Copy values</button>
                    <button class="action" type="button" data-reset>Reset</button>
                </div>
                <p class="status" aria-live="polite"></p>
            </div>
        </section>
    `;

    const panel = shadow.querySelector('.panel');
    const status = shadow.querySelector('.status');
    const inputs = [...shadow.querySelectorAll('[data-property]')];
    const cuttingControls = shadow.querySelector('[data-cutting-controls]');

    function hexToRgbChannels(hex) {
        const value = hex.replace('#', '');
        return [
            parseInt(value.slice(0, 2), 16),
            parseInt(value.slice(2, 4), 16),
            parseInt(value.slice(4, 6), 16)
        ].join(' ');
    }

    function setStatus(message) {
        status.textContent = message;
        clearTimeout(setStatus.timer);
        setStatus.timer = setTimeout(() => { status.textContent = ''; }, 1600);
    }

    function updateOutput(property) {
        const output = shadow.querySelector(`[data-output="${property}"]`);
        if (!output) return;
        const suffix = ['opacity', 'majorOpacity', 'grainOpacity', 'grainContrast'].includes(property)
            ? '%'
            : ['rotation', 'angleStep'].includes(property)
                ? '°'
                : ['majorEvery', 'grainEnabled', 'grainBlend'].includes(property) ? '' : 'px';
        output.textContent = `${state[property]}${suffix}`;
    }

    function renderCuttingMat() {
        if (!bgLayer || state.pattern !== 'cutting-mat') {
            cuttingMatSvg.replaceChildren();
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const margin = 24;
        const spacing = Math.max(8, state.spacing);
        const majorEvery = Math.max(2, state.majorEvery);
        const minorOpacity = state.opacity / 100;
        const majorOpacity = state.majorOpacity / 100;
        const color = state.color;
        const minorLines = [];
        const majorLines = [];
        const edgeTicks = [];
        const labels = [];

        for (let x = margin, index = 0; x <= width - margin; x += spacing, index++) {
            const isMajor = index % majorEvery === 0;
            (isMajor ? majorLines : minorLines).push(
                `<line x1="${x}" y1="${margin}" x2="${x}" y2="${height - margin}"/>`
            );
            if (state.edgeTicks) {
                const length = isMajor ? 12 : 6;
                edgeTicks.push(
                    `<line x1="${x}" y1="${margin}" x2="${x}" y2="${margin + length}"/>`,
                    `<line x1="${x}" y1="${height - margin}" x2="${x}" y2="${height - margin - length}"/>`
                );
            }
            if (state.numericGuides && isMajor && index > 0) {
                labels.push(
                    `<text x="${x}" y="${margin - 8}" text-anchor="middle">${index}</text>`,
                    `<text x="${x}" y="${height - margin + 15}" text-anchor="middle">${index}</text>`
                );
            }
        }

        for (let y = margin, index = 0; y <= height - margin; y += spacing, index++) {
            const isMajor = index % majorEvery === 0;
            (isMajor ? majorLines : minorLines).push(
                `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}"/>`
            );
            if (state.edgeTicks) {
                const length = isMajor ? 12 : 6;
                edgeTicks.push(
                    `<line x1="${margin}" y1="${y}" x2="${margin + length}" y2="${y}"/>`,
                    `<line x1="${width - margin}" y1="${y}" x2="${width - margin - length}" y2="${y}"/>`
                );
            }
            if (state.numericGuides && isMajor && index > 0) {
                labels.push(
                    `<text x="${margin - 8}" y="${y + 3}" text-anchor="end">${index}</text>`,
                    `<text x="${width - margin + 8}" y="${y + 3}" text-anchor="start">${index}</text>`
                );
            }
        }

        const guidePaths = [];
        const guideLabels = [];
        const originX = margin;
        const originY = height - margin;
        const guideLimit = Math.min(width, height) * 0.72;

        if (state.radiusGuides) {
            [1, 2, 3].forEach((step, index) => {
                const radius = spacing * majorEvery * step;
                if (radius >= guideLimit) return;
                guidePaths.push(
                    `<path d="M ${originX + radius} ${originY} A ${radius} ${radius} 0 0 0 ${originX} ${originY - radius}"/>`
                );
                guideLabels.push(
                    `<text x="${originX + radius * 0.71}" y="${originY - radius * 0.71 - 5}">R${index + 1}</text>`
                );
            });
        }

        if (state.angleGuides) {
            const rayLength = guideLimit;
            const angleStep = Math.max(5, Number(state.angleStep));
            for (let angle = angleStep; angle < 90; angle += angleStep) {
                const radians = angle * Math.PI / 180;
                const endX = originX + Math.cos(radians) * rayLength;
                const endY = originY - Math.sin(radians) * rayLength;
                guidePaths.push(`<line x1="${originX}" y1="${originY}" x2="${endX}" y2="${endY}"/>`);
                guideLabels.push(
                    `<text x="${originX + Math.cos(radians) * 72}" y="${originY - Math.sin(radians) * 72 - 5}">${angle}°</text>`
                );
            }
        }

        cuttingMatSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        cuttingMatSvg.innerHTML = `
            <g fill="none" stroke="${color}" stroke-width="${state.thickness}" stroke-opacity="${minorOpacity}">
                ${minorLines.join('')}
            </g>
            <g fill="none" stroke="${color}" stroke-width="${Math.max(state.thickness, 1)}" stroke-opacity="${majorOpacity}">
                ${majorLines.join('')}
                <rect x="${margin}" y="${margin}" width="${Math.max(0, width - margin * 2)}" height="${Math.max(0, height - margin * 2)}"/>
                ${edgeTicks.join('')}
            </g>
            <g fill="none" stroke="${color}" stroke-width="${state.thickness}" stroke-opacity="${majorOpacity * 0.8}" stroke-dasharray="5 5">
                ${guidePaths.join('')}
            </g>
            <g fill="${color}" fill-opacity="${majorOpacity}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9">
                ${labels.join('')}
                ${guideLabels.join('')}
            </g>
        `;
    }

    function applyState() {
        ROOT.dataset.bgGridPattern = state.pattern;
        ROOT.toggleAttribute('data-bg-grid-fade', state.fade);
        ROOT.style.setProperty('--bg-grid-rgb', hexToRgbChannels(state.color));
        ROOT.style.setProperty('--bg-grid-spacing', `${state.spacing}px`);
        ROOT.style.setProperty('--bg-grid-thickness', `${state.thickness}px`);
        ROOT.style.setProperty('--bg-grid-opacity', String(state.opacity / 100));
        ROOT.style.setProperty('--bg-grid-rotation', `${state.rotation}deg`);
        ROOT.style.setProperty('--bg-grid-offset-x', `${state.offsetX}px`);
        ROOT.style.setProperty('--bg-grid-offset-y', `${state.offsetY}px`);
        ROOT.style.setProperty('--bg-grid-blur', `${state.blur}px`);
        ROOT.style.setProperty('--bg-grid-blend', state.blend);
        ROOT.style.setProperty('--bg-grain-opacity', String(state.grainEnabled ? state.grainOpacity / 100 : 0));
        ROOT.style.setProperty('--bg-grain-size', `${state.grainSize}px`);
        ROOT.style.setProperty('--bg-grain-contrast', `${state.grainContrast}%`);
        ROOT.style.setProperty('--bg-grain-blend', state.grainBlend);
        cuttingControls.hidden = state.pattern !== 'cutting-mat';
        renderCuttingMat();
    }

    function syncInputs() {
        inputs.forEach(input => {
            const property = input.dataset.property;
            if (input.type === 'checkbox') input.checked = state[property];
            else input.value = String(state[property]);
            updateOutput(property);
        });
    }

    inputs.forEach(input => {
        const eventName = input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input';
        input.addEventListener(eventName, () => {
            const property = input.dataset.property;
            if (input.type === 'checkbox') state[property] = input.checked;
            else if (input.type === 'range' || property === 'angleStep') state[property] = Number(input.value);
            else state[property] = input.value;
            updateOutput(property);
            applyState();
        });
    });

    shadow.querySelector('.collapse').addEventListener('click', event => {
        const collapsed = panel.classList.toggle('collapsed');
        event.currentTarget.textContent = collapsed ? '+' : '−';
        event.currentTarget.setAttribute('aria-label', collapsed ? 'Expand controller' : 'Collapse controller');
    });

    shadow.querySelector('[data-reset]').addEventListener('click', () => {
        Object.assign(state, defaults);
        syncInputs();
        applyState();
        setStatus('Grid reset');
    });

    shadow.querySelector('[data-copy]').addEventListener('click', async () => {
        const text = `ReelFolio background grid values:\n${JSON.stringify(state, null, 2)}`;
        try {
            await navigator.clipboard.writeText(text);
            setStatus('Values copied');
        } catch (_) {
            setStatus('Copy failed');
        }
    });

    syncInputs();
    applyState();
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderCuttingMat, 100);
    }, { passive: true });
})();
