(() => {
    'use strict';

    const ROOT = document.documentElement;
    const defaults = {
        resumeFrom: '#06371e',
        resumeTo: '#011e0a',
        linkedinFrom: '#083f54',
        linkedinTo: '#012b3c',
        xFrom: '#303030',
        xTo: '#000000',
        emailFrom: '#321f21',
        emailTo: '#241418'
    };
    const state = { ...defaults };

    const groups = [
        { id: 'resume', title: 'Resume', from: 'resumeFrom', to: 'resumeTo' },
        { id: 'linkedin', title: 'LinkedIn', from: 'linkedinFrom', to: 'linkedinTo' },
        { id: 'x', title: 'X', from: 'xFrom', to: 'xTo' },
        { id: 'email', title: 'Email', from: 'emailFrom', to: 'emailTo' }
    ];

    const host = document.createElement('div');
    host.id = 'reelfolio-button-lab';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
        <style>
            :host { display: block; color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
            * { box-sizing: border-box; }
            .content { padding: 14px; display: grid; gap: 12px; color: #f6f1ea; }
            .preview {
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: 48px;
            }
            .preview button {
                border: 0;
                color: #f4efe6;
                pointer-events: none;
                box-shadow:
                    inset 0 1px 0 rgba(255,255,255,0.16),
                    0 0 0 1px rgba(0,0,0,0.28);
            }
            .preview-resume {
                height: 40px;
                padding: 0 14px;
                border-radius: 999px;
                font: 600 12px Inter, system-ui, sans-serif;
            }
            .preview-icon {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                font: 700 13px Inter, system-ui, sans-serif;
            }
            .group {
                display: grid;
                gap: 8px;
                padding: 10px;
                border-radius: 12px;
                background: rgba(255,255,255,0.04);
            }
            .title { font-size: 11px; font-weight: 700; }
            .row {
                display: grid;
                grid-template-columns: 52px 46px 1fr;
                align-items: center;
                gap: 8px;
            }
            .label { font-size: 12px; color: rgba(255,255,255,0.68); }
            input[type="color"] {
                width: 46px;
                height: 32px;
                padding: 3px;
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 8px;
                background: rgba(255,255,255,0.08);
            }
            .hex {
                width: 100%;
                height: 32px;
                padding: 0 8px;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: inherit;
                background: rgba(255,255,255,0.06);
                font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
            }
            .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .action {
                height: 36px;
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 10px;
                color: inherit;
                background: rgba(255,255,255,0.08);
                cursor: pointer;
            }
            .action.primary { background: #2f6a52; border-color: #3d7a60; }
            .status { min-height: 16px; margin: 0; font-size: 11px; color: #b7efc5; }
        </style>
        <div class="content">
            <div class="preview" aria-hidden="true">
                <button class="preview-resume" type="button" data-preview="resume">Resume</button>
                <button class="preview-icon" type="button" data-preview="linkedin">in</button>
                <button class="preview-icon" type="button" data-preview="x">X</button>
                <button class="preview-icon" type="button" data-preview="email">@</button>
            </div>
            ${groups.map(group => `
                <div class="group">
                    <span class="title">${group.title}</span>
                    <div class="row">
                        <span class="label">Top</span>
                        <input type="color" data-property="${group.from}">
                        <input class="hex" type="text" maxlength="7" spellcheck="false" data-hex="${group.from}" aria-label="${group.title} top hex">
                    </div>
                    <div class="row">
                        <span class="label">Bottom</span>
                        <input type="color" data-property="${group.to}">
                        <input class="hex" type="text" maxlength="7" spellcheck="false" data-hex="${group.to}" aria-label="${group.title} bottom hex">
                    </div>
                </div>
            `).join('')}
            <div class="actions">
                <button class="action primary" type="button" data-copy>Copy values</button>
                <button class="action" type="button" data-reset>Reset</button>
            </div>
            <p class="status" aria-live="polite"></p>
        </div>
    `;

    function normalizeHex(value) {
        const next = value.trim();
        return /^#([0-9a-fA-F]{6})$/.test(next) ? next.toLowerCase() : null;
    }

    function applyState() {
        ROOT.style.setProperty('--landing-resume-from', state.resumeFrom);
        ROOT.style.setProperty('--landing-resume-to', state.resumeTo);
        ROOT.style.setProperty('--landing-linkedin-from', state.linkedinFrom);
        ROOT.style.setProperty('--landing-linkedin-to', state.linkedinTo);
        ROOT.style.setProperty('--landing-x-from', state.xFrom);
        ROOT.style.setProperty('--landing-x-to', state.xTo);
        ROOT.style.setProperty('--landing-email-from', state.emailFrom);
        ROOT.style.setProperty('--landing-email-to', state.emailTo);
        groups.forEach(group => {
            const preview = shadow.querySelector(`[data-preview="${group.id}"]`);
            if (preview) preview.style.background = `linear-gradient(180deg, ${state[group.from]}, ${state[group.to]})`;
        });
    }

    function syncInputs() {
        shadow.querySelectorAll('[data-property]').forEach(input => {
            input.value = state[input.dataset.property];
        });
        shadow.querySelectorAll('[data-hex]').forEach(input => {
            input.value = state[input.dataset.hex];
        });
    }

    const status = shadow.querySelector('.status');
    shadow.querySelectorAll('[data-property]').forEach(input => {
        input.addEventListener('input', () => {
            state[input.dataset.property] = input.value;
            const hex = shadow.querySelector(`[data-hex="${input.dataset.property}"]`);
            if (hex) hex.value = input.value;
            applyState();
        });
    });
    shadow.querySelectorAll('[data-hex]').forEach(input => {
        input.addEventListener('change', () => {
            const value = normalizeHex(input.value);
            if (!value) {
                input.value = state[input.dataset.hex];
                return;
            }
            state[input.dataset.hex] = value;
            const color = shadow.querySelector(`[data-property="${input.dataset.hex}"]`);
            if (color) color.value = value;
            applyState();
        });
    });
    shadow.querySelector('[data-reset]').addEventListener('click', () => {
        Object.assign(state, defaults);
        syncInputs();
        applyState();
        status.textContent = 'Button colors reset';
        setTimeout(() => { status.textContent = ''; }, 1400);
    });
    shadow.querySelector('[data-copy]').addEventListener('click', async () => {
        const text = [
            `--landing-resume-from: ${state.resumeFrom};`,
            `--landing-resume-to: ${state.resumeTo};`,
            `--landing-linkedin-from: ${state.linkedinFrom};`,
            `--landing-linkedin-to: ${state.linkedinTo};`,
            `--landing-x-from: ${state.xFrom};`,
            `--landing-x-to: ${state.xTo};`,
            `--landing-email-from: ${state.emailFrom};`,
            `--landing-email-to: ${state.emailTo};`
        ].join('\n');
        try {
            await navigator.clipboard.writeText(text);
            status.textContent = 'CSS variables copied';
        } catch (_) {
            status.textContent = 'Copy failed';
        }
        setTimeout(() => { status.textContent = ''; }, 1400);
    });

    syncInputs();
    applyState();

    const register = () => {
        if (!window.ReelFolioLab) return false;
        window.ReelFolioLab.register({
            id: 'buttons',
            title: 'Landing buttons',
            hint: 'Resume, LinkedIn, X, Email colors',
            width: 320,
            autoOpen: true,
            host
        });
        return true;
    };
    if (!register()) {
        document.addEventListener('DOMContentLoaded', register, { once: true });
    }
})();
