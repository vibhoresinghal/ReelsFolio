(() => {
    'use strict';

    if (new URLSearchParams(window.location.search).has('experiment-preview')) return;

    const ROOT = document.documentElement;
    const STYLE_ID = 'reelfolio-experiment-overrides';
    const HOST_ID = 'reelfolio-experiment-controller';
    const originalColors = new Map();
    const colorOverrides = new Map();
    let initialized = false;
    let sizeWasChanged = false;
    let radiusWasChanged = false;
    let lastSyncedSectionId = null;
    const previewDocuments = {
        iosSafari: null,
        androidChrome: null
    };
    let currentPreviewMode = 'desktop';
    const haloDefaults = { size: 72, darkness: 66, blur: 30 };
    const haloState = { ...haloDefaults };
    const resumeButtonDefaults = {
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: 0.2,
        iconGap: 6,
        buttonGap: 8,
        paddingX: 16,
        height: 48
    };
    const resumeButtonState = { ...resumeButtonDefaults };
    const mobilePresets = {
        iosSafari: {
            label: 'iPhone 12 · Safari',
            statusTime: '8:59',
            screenWidth: 390,
            screenHeight: 844,
            browserTop: 47,
            browserBottom: 96
        },
        androidChrome: {
            label: 'S25 Ultra · Chrome',
            statusTime: '9:16',
            screenWidth: 384,
            screenHeight: 832,
            browserTop: 85,
            browserBottom: 24
        }
    };
    const createMobileState = videoHeightPx => ({
        videoHeightPx,
        cornerRadiusPx: 0,
        sizeChanged: false,
        radiusChanged: false,
        hideNavigation: true,
        hidePlaybackControls: true,
        hideActionButtons: true,
        hideProfileName: true,
        hideProfileBio: true,
        hideProfileLocations: true,
        bottomBlurBlend: false,
        profileScalePercent: 100,
        profilePosition: { x: 0, y: 0 },
        positions: {
            navigation: { x: 0, y: 0 },
            playback: { x: 0, y: 0 },
            actions: { x: 0, y: 0 }
        }
    });
    const mobileStates = {
        iosSafari: createMobileState(701),
        androidChrome: createMobileState(723)
    };
    let activeMobilePreset = 'iosSafari';
    let mobileState = mobileStates[activeMobilePreset];

    const overrideStyle = document.createElement('style');
    overrideStyle.id = STYLE_ID;
    overrideStyle.textContent = `
        @media (min-width: 601px) {
            :root[data-reelfolio-exp-size] .video-frame,
            :root[data-reelfolio-exp-size] .landing-video-frame {
                width: min(var(--reelfolio-exp-portrait-width), 95vw) !important;
                height: auto !important;
                aspect-ratio: 9 / 16 !important;
            }

            :root[data-reelfolio-exp-size] .video-section.landscape-mode .video-frame {
                width: min(var(--reelfolio-exp-landscape-width), calc(100vw - 152px)) !important;
                height: auto !important;
                aspect-ratio: 16 / 9 !important;
            }

            :root[data-reelfolio-exp-radius] .video-frame,
            :root[data-reelfolio-exp-radius] .landing-video-frame {
                border-radius: var(--reelfolio-exp-radius) !important;
            }

            :root[data-reelfolio-exp-hide-navbar] #navbarWrapper {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            :root[data-reelfolio-exp-hide-controls] .control-bar {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            :root[data-reelfolio-exp-position-navbar] #navbarWrapper {
                translate: var(--reelfolio-exp-navbar-x) var(--reelfolio-exp-navbar-y) !important;
            }

            :root[data-reelfolio-exp-position-controls] .control-bar {
                translate: var(--reelfolio-exp-controls-x) var(--reelfolio-exp-controls-y) !important;
            }

            :root[data-reelfolio-exp-position-arrows] #fixedNavArrows {
                translate: var(--reelfolio-exp-arrows-x) var(--reelfolio-exp-arrows-y) !important;
            }
        }

        @media (max-width: 600px) {
            :root[data-mobile-exp-enabled]:not([data-mobile-exp-hide-playback]) .control-bar {
                display: flex !important;
            }

            :root[data-mobile-exp-size] .video-frame,
            :root[data-mobile-exp-size] .landing-video-frame {
                width: 100vw !important;
                height: var(--mobile-exp-frame-height) !important;
                aspect-ratio: unset !important;
            }

            :root[data-mobile-exp-radius] .video-frame,
            :root[data-mobile-exp-radius] .landing-video-frame {
                border-radius: var(--mobile-exp-radius) !important;
            }

            :root[data-mobile-exp-hide-navigation] #mobileBottomNav,
            :root[data-mobile-exp-hide-playback] .control-bar,
            :root[data-mobile-exp-hide-actions] #fixedNavArrows {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            :root[data-mobile-exp-position-navigation] #mobileBottomNav {
                translate: var(--mobile-exp-navigation-x) var(--mobile-exp-navigation-y) !important;
            }

            :root[data-mobile-exp-position-playback] .control-bar {
                display: flex !important;
                translate: var(--mobile-exp-playback-x) var(--mobile-exp-playback-y) !important;
            }

            :root[data-mobile-exp-position-actions] #fixedNavArrows {
                translate: var(--mobile-exp-actions-x) var(--mobile-exp-actions-y) !important;
            }

            :root[data-mobile-exp-hide-profile-name] .landing-name,
            :root[data-mobile-exp-hide-profile-bio] .landing-bio,
            :root[data-mobile-exp-hide-profile-locations] .landing-locations {
                display: none !important;
            }

            :root[data-mobile-exp-position-profile] .landing-profile-info {
                translate: var(--mobile-exp-profile-x) var(--mobile-exp-profile-y) !important;
            }

            :root[data-mobile-exp-scale-profile] .landing-profile-info {
                scale: var(--mobile-exp-profile-scale) !important;
                transform-origin: left bottom !important;
            }

            :root[data-mobile-exp-bottom-blur] .video-frame::before,
            :root[data-mobile-exp-bottom-blur] .landing-video-frame::before {
                content: '' !important;
                position: absolute !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                height: clamp(36px, 9vh, 72px) !important;
                z-index: 60 !important;
                pointer-events: none !important;
                background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.5)) !important;
                backdrop-filter: blur(14px) !important;
                -webkit-backdrop-filter: blur(14px) !important;
                mask-image: linear-gradient(to bottom, transparent, black 45%) !important;
                -webkit-mask-image: linear-gradient(to bottom, transparent, black 45%) !important;
            }
        }
    `;
    document.head.appendChild(overrideStyle);

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, Number(value) || 0));
    }

    function parseColor(color) {
        const probe = document.createElement('span');
        probe.style.color = color || '#000000';
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        const channels = resolved.match(/\d+(?:\.\d+)?/g) || ['0', '0', '0'];
        return channels.slice(0, 3).map(channel => clamp(Math.round(Number(channel)), 0, 255));
    }

    function rgbToHex(rgb) {
        return `#${rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
    }

    function getCurrentSection() {
        const sections = [...document.querySelectorAll('.landing-section, .video-section')];
        if (!sections.length) return null;

        const viewportCenter = window.innerHeight / 2;
        return sections.reduce((closest, section) => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs((rect.top + rect.bottom) / 2 - viewportCenter);
            return !closest || distance < closest.distance ? { section, distance } : closest;
        }, null)?.section || null;
    }

    function getSectionId(section) {
        return section?.getAttribute('data-video-id') || 'unknown';
    }

    function getFrame(section) {
        return section?.querySelector('.video-frame, .landing-video-frame') || null;
    }

    function initialize() {
        if (initialized) return;
        const firstSection = getCurrentSection();
        if (!firstSection) return;
        initialized = true;

        const host = document.createElement('div');
        host.id = HOST_ID;
        host.setAttribute('aria-label', 'Visual experiment controller');
        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: 'open' });
        const phonePreviewMarkup = presetId => `
            <div class="mobile-preview" data-preview-device="${presetId}" data-device="${presetId}">
                <div class="phone-browser-top" aria-label="Simulated mobile browser top bar">
                    <div class="phone-status">
                        <span data-phone-time></span>
                        <span class="phone-status-icons ios-status-icons"><span>••••</span><span>⌁</span><span>▰</span></span>
                        <span class="phone-status-icons android-status-icons"><span>◖</span><span>5G</span><span>▥</span><span>20</span></span>
                    </div>
                    <div class="phone-url-row">
                        <span class="browser-icon">⌂</span>
                        <div class="phone-url"><span>🔒</span><span>reelfolio.local</span></div>
                        <span class="browser-icon">⋮</span>
                    </div>
                </div>
                <iframe title="${mobilePresets[presetId].label} ReelFolio preview" data-mobile-preview-frame="${presetId}"></iframe>
                <div class="phone-browser-bottom" aria-label="Simulated mobile browser navigation">
                    <video class="browser-blur-video" data-browser-blur-video="${presetId}" muted playsinline aria-hidden="true"></video>
                    <div class="ios-browser-toolbar">
                        <div class="ios-nav-pair"><span>‹</span><span>›</span></div>
                        <span class="ios-url-pill">▤&nbsp;&nbsp;reelfolio.local&nbsp;&nbsp;↻</span>
                        <span class="ios-more">•••</span>
                    </div>
                    <div class="android-gesture"></div>
                </div>
            </div>
        `;
        shadow.innerHTML = `
            <style>
                :host {
                    all: initial;
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    z-index: 2147483647;
                    color-scheme: dark;
                    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }

                * { box-sizing: border-box; }

                .panel {
                    width: min(320px, calc(100vw - 24px));
                    max-height: calc(100vh - 32px);
                    overflow: auto;
                    position: relative;
                    z-index: 3;
                    color: #fff;
                    background: rgba(18, 18, 22, 0.94);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                }

                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 48px;
                    padding: 8px 10px 8px 14px;
                    position: sticky;
                    top: 0;
                    z-index: 2;
                    background: rgba(18, 18, 22, 0.96);
                }

                .title {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                }

                .mode-switch {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px;
                    padding: 4px;
                    border-radius: 11px;
                    background: rgba(255, 255, 255, 0.08);
                }

                .mode-button {
                    min-height: 32px;
                    border-radius: 8px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.62);
                    font-size: 11px;
                    font-weight: 650;
                }

                .mode-button.active {
                    color: #fff;
                    background: #7667ed;
                }

                .device-switch {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px;
                    padding: 4px;
                    border-radius: 11px;
                    background: rgba(255, 255, 255, 0.08);
                }

                .device-button {
                    min-height: 34px;
                    padding: 5px 7px;
                    border-radius: 8px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.62);
                    font-size: 10px;
                    font-weight: 650;
                }

                .device-button.active {
                    color: #fff;
                    background: #4c476c;
                }

                .measurements {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 6px 12px;
                    margin: 0;
                    font-size: 11px;
                }

                .measurements dt {
                    color: rgba(255, 255, 255, 0.58);
                }

                .measurements dd {
                    margin: 0;
                    color: #fff;
                    font-variant-numeric: tabular-nums;
                    text-align: right;
                }

                button, input { font: inherit; }

                button {
                    color: inherit;
                    border: 0;
                    cursor: pointer;
                }

                .collapse {
                    width: 32px;
                    height: 32px;
                    border-radius: 9px;
                    background: rgba(255, 255, 255, 0.1);
                    font-size: 18px;
                    line-height: 1;
                }

                .content {
                    display: grid;
                    gap: 14px;
                    padding: 4px 14px 14px;
                }

                .panel.collapsed {
                    width: auto;
                    overflow: hidden;
                }

                .panel.collapsed .content { display: none; }

                [hidden] { display: none !important; }

                .section {
                    display: grid;
                    gap: 9px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.12);
                }

                .section:first-child {
                    padding-top: 4px;
                    border-top: 0;
                }

                .label-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.78);
                }

                .value {
                    color: #fff;
                    font-variant-numeric: tabular-nums;
                }

                .video-name {
                    max-width: 180px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #fff;
                    font-weight: 650;
                }

                input[type="range"] {
                    width: 100%;
                    accent-color: #8b7cff;
                }

                .color-row {
                    display: grid;
                    grid-template-columns: 48px repeat(3, 1fr);
                    gap: 7px;
                }

                input[type="color"] {
                    width: 48px;
                    height: 38px;
                    padding: 2px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 9px;
                    background: transparent;
                }

                .channel {
                    min-width: 0;
                    height: 38px;
                    padding: 0 7px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 9px;
                    outline: none;
                }

                .channel:focus { border-color: #8b7cff; }

                .channel-labels {
                    display: grid;
                    grid-template-columns: 48px repeat(3, 1fr);
                    gap: 7px;
                    margin-bottom: -5px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.55);
                    font-size: 10px;
                }

                .toggle-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    min-height: 30px;
                    font-size: 12px;
                }

                .toggle-row input {
                    width: 18px;
                    height: 18px;
                    accent-color: #8b7cff;
                }

                .position-group {
                    display: grid;
                    gap: 7px;
                }

                .position-title {
                    color: #fff;
                    font-size: 12px;
                    font-weight: 650;
                }

                .position-control {
                    display: grid;
                    grid-template-columns: 14px 1fr 48px;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.58);
                    font-size: 10px;
                }

                .position-control output {
                    color: #fff;
                    font-variant-numeric: tabular-nums;
                    text-align: right;
                }

                .actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .action {
                    min-height: 38px;
                    padding: 8px 10px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    font-size: 12px;
                    font-weight: 650;
                }

                .action.primary { background: #7667ed; }

                .status {
                    min-height: 14px;
                    margin: -4px 0 0;
                    color: rgba(255, 255, 255, 0.65);
                    font-size: 10px;
                    text-align: center;
                }

                .mobile-previews {
                    position: fixed;
                    inset: 0 340px 0 0;
                    display: grid;
                    place-items: center;
                    z-index: 2;
                    pointer-events: none;
                }

                .mobile-previews-inner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    transform: scale(var(--preview-scale));
                    transform-origin: center;
                    pointer-events: auto;
                }

                .mobile-preview {
                    position: relative;
                    width: calc(var(--device-screen-width) + 22px);
                    height: calc(var(--device-screen-height) + 22px);
                    flex: 0 0 auto;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    border-radius: 42px;
                    background: #111;
                    border: 1px solid rgba(255, 255, 255, 0.24);
                    box-shadow: 0 30px 100px rgba(0, 0, 0, 0.62);
                    overflow: hidden;
                }

                .preview-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 1;
                    background:
                        radial-gradient(circle at 40% 30%, rgba(79, 70, 150, 0.16), transparent 34%),
                        #080a0d;
                }

                .mobile-preview iframe {
                    width: 100%;
                    min-height: 0;
                    flex: 1;
                    border: 0;
                    background: #000;
                }

                .phone-browser-top {
                    flex: 0 0 var(--browser-top-height);
                    display: flex;
                    flex-direction: column;
                    color: #e7e9ed;
                    background: #090909;
                    border-radius: 31px 31px 0 0;
                }

                .phone-status {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 19px;
                    padding: 0 5px;
                    font-size: 10px;
                    font-weight: 650;
                }

                .mobile-preview[data-device="iosSafari"] .phone-browser-top {
                    padding: 8px 16px 5px;
                }

                .mobile-preview[data-device="iosSafari"] .phone-status {
                    flex: 1;
                    height: auto;
                }

                .mobile-preview[data-device="iosSafari"] .phone-url-row {
                    display: none;
                }

                .mobile-preview[data-device="androidChrome"] .phone-browser-top {
                    padding: 5px 8px 7px;
                    background: #160e0f;
                }

                .mobile-preview[data-device="androidChrome"] .phone-status {
                    flex: 0 0 22px;
                }

                .phone-status-icons {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    color: rgba(255, 255, 255, 0.82);
                }

                .mobile-preview[data-device="iosSafari"] .android-status-icons,
                .mobile-preview[data-device="androidChrome"] .ios-status-icons {
                    display: none;
                }

                .phone-url-row {
                    display: grid;
                    grid-template-columns: 28px 1fr 28px;
                    align-items: center;
                    gap: 6px;
                    flex: 1;
                }

                .browser-icon {
                    display: grid;
                    place-items: center;
                    width: 28px;
                    height: 28px;
                    color: rgba(255, 255, 255, 0.78);
                    font-size: 17px;
                }

                .phone-url {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    min-width: 0;
                    height: 36px;
                    padding: 0 12px;
                    border-radius: 18px;
                    color: rgba(255, 255, 255, 0.78);
                    background: #303134;
                    font-size: 11px;
                }

                .phone-url span:last-child {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .phone-browser-bottom {
                    flex: 0 0 var(--browser-bottom-height);
                    position: relative;
                    overflow: hidden;
                    color: rgba(255, 255, 255, 0.82);
                    background: #090909;
                    border-radius: 0 0 31px 31px;
                }

                .browser-blur-video {
                    display: none;
                    position: absolute;
                    inset: -18px;
                    width: calc(100% + 36px);
                    height: calc(100% + 36px);
                    object-fit: cover;
                    object-position: center bottom;
                    filter: blur(18px) saturate(1.15);
                    opacity: 0.82;
                    transform: scale(1.08);
                    pointer-events: none;
                }

                .mobile-preview.bottom-blur-active .phone-browser-bottom {
                    background: rgba(0, 0, 0, 0.28);
                }

                .mobile-preview.bottom-blur-active .browser-blur-video {
                    display: block;
                }

                .ios-browser-toolbar {
                    height: 100%;
                    display: grid;
                    grid-template-columns: 76px 1fr 44px;
                    align-items: center;
                    gap: 8px;
                    padding: 9px 10px 14px;
                    position: relative;
                    z-index: 1;
                }

                .ios-browser-toolbar > span,
                .ios-browser-toolbar .ios-nav-pair span {
                    display: grid;
                    place-items: center;
                    height: 38px;
                    font-size: 19px;
                }

                .ios-nav-pair {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    height: 44px;
                    border-radius: 24px;
                    background: #242424;
                }

                .ios-url-pill {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    min-width: 0;
                    height: 44px !important;
                    padding: 0 13px;
                    border-radius: 24px;
                    background: #242424;
                    font-size: 11px !important;
                    overflow: hidden;
                    white-space: nowrap;
                }

                .ios-more {
                    height: 44px !important;
                    border-radius: 24px;
                    background: #242424;
                }

                .android-gesture {
                    height: 100%;
                    display: grid;
                    place-items: center;
                    position: relative;
                    z-index: 1;
                    background: rgba(0, 0, 0, 0.24);
                }

                .android-gesture::after {
                    content: '';
                    width: 76px;
                    height: 4px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.62);
                }

                .mobile-preview[data-device="iosSafari"] .android-gesture,
                .mobile-preview[data-device="androidChrome"] .ios-browser-toolbar {
                    display: none;
                }

                @media (max-width: 600px) {
                    :host {
                        top: 8px;
                        right: 8px;
                    }

                    .panel {
                        width: min(300px, calc(100vw - 16px));
                        max-height: calc(100vh - 16px);
                    }

                    .mobile-previews {
                        display: none !important;
                    }
                }
            </style>
            <section class="panel" role="dialog" aria-label="Visual experiment controller">
                <div class="header">
                    <h2 class="title">Visual experiments</h2>
                    <button class="collapse" type="button" aria-label="Collapse controller" aria-expanded="true">−</button>
                </div>
                <div class="content">
                    <div class="mode-switch" role="group" aria-label="Preview mode">
                        <button class="mode-button active" type="button" data-preview-mode="desktop">Desktop</button>
                        <button class="mode-button" type="button" data-preview-mode="mobile">Mobile mockup</button>
                    </div>

                    <div class="section">
                        <span class="position-title">Play button halo</span>
                        <div class="label-row">
                            <label for="play-halo-size">Size</label>
                            <span class="value" data-halo-value="size">72px</span>
                        </div>
                        <input id="play-halo-size" type="range" min="12" max="90" step="1" value="72" data-halo="size">
                        <div class="label-row">
                            <label for="play-halo-darkness">Darkness</label>
                            <span class="value" data-halo-value="darkness">66%</span>
                        </div>
                        <input id="play-halo-darkness" type="range" min="0" max="90" step="1" value="66" data-halo="darkness">
                        <div class="label-row">
                            <label for="play-halo-blur">Blur</label>
                            <span class="value" data-halo-value="blur">30px</span>
                        </div>
                        <input id="play-halo-blur" type="range" min="0" max="30" step="1" value="30" data-halo="blur">
                    </div>

                    <div class="section" data-desktop-controls>
                        <span class="position-title">Resume button typography</span>
                        <div class="label-row">
                            <label for="resume-font-size">Font size</label>
                            <span class="value" data-resume-button-value="fontSize">11.5px</span>
                        </div>
                        <input id="resume-font-size" type="range" min="8" max="20" step="0.5" value="11.5" data-resume-button="fontSize">
                        <div class="label-row">
                            <label for="resume-font-weight">Font weight</label>
                            <span class="value" data-resume-button-value="fontWeight">500</span>
                        </div>
                        <input id="resume-font-weight" type="range" min="400" max="900" step="50" value="500" data-resume-button="fontWeight">
                        <div class="label-row">
                            <label for="resume-letter-spacing">Letter spacing</label>
                            <span class="value" data-resume-button-value="letterSpacing">0.2px</span>
                        </div>
                        <input id="resume-letter-spacing" type="range" min="-1" max="5" step="0.1" value="0.2" data-resume-button="letterSpacing">
                        <div class="label-row">
                            <label for="resume-icon-gap">Icon / text gap</label>
                            <span class="value" data-resume-button-value="iconGap">6px</span>
                        </div>
                        <input id="resume-icon-gap" type="range" min="0" max="24" step="1" value="6" data-resume-button="iconGap">
                        <div class="label-row">
                            <label for="resume-button-gap">Gap between buttons</label>
                            <span class="value" data-resume-button-value="buttonGap">8px</span>
                        </div>
                        <input id="resume-button-gap" type="range" min="0" max="24" step="1" value="8" data-resume-button="buttonGap">
                        <div class="label-row">
                            <label for="resume-padding-x">Horizontal padding</label>
                            <span class="value" data-resume-button-value="paddingX">16px</span>
                        </div>
                        <input id="resume-padding-x" type="range" min="4" max="40" step="1" value="16" data-resume-button="paddingX">
                        <div class="label-row">
                            <label for="resume-button-height">Button height</label>
                            <span class="value" data-resume-button-value="height">48px</span>
                        </div>
                        <input id="resume-button-height" type="range" min="34" max="72" step="1" value="48" data-resume-button="height">
                    </div>

                    <div class="section" data-desktop-controls>
                        <div class="label-row">
                            <span>Active video</span>
                            <span class="video-name" data-active-video></span>
                        </div>
                        <div class="channel-labels" aria-hidden="true">
                            <span></span><span>R</span><span>G</span><span>B</span>
                        </div>
                        <div class="color-row">
                            <input type="color" data-color aria-label="Background color">
                            <input class="channel" type="number" min="0" max="255" data-channel="0" aria-label="Red">
                            <input class="channel" type="number" min="0" max="255" data-channel="1" aria-label="Green">
                            <input class="channel" type="number" min="0" max="255" data-channel="2" aria-label="Blue">
                        </div>
                    </div>

                    <div class="section" data-desktop-controls>
                        <div class="label-row">
                            <label for="frame-size">Frame height</label>
                            <span class="value" data-size-value></span>
                        </div>
                        <input id="frame-size" type="range" min="35" max="110" step="1" data-frame-size>
                        <div class="label-row">
                            <label for="frame-radius">Corner radius</label>
                            <span class="value" data-radius-value></span>
                        </div>
                        <input id="frame-radius" type="range" min="0" max="80" step="1" data-radius>
                    </div>

                    <div class="section" data-desktop-controls>
                        <label class="toggle-row">
                            <span>Hide top navbar</span>
                            <input type="checkbox" data-hide-navbar checked>
                        </label>
                        <label class="toggle-row">
                            <span>Hide pause / mute controls</span>
                            <input type="checkbox" data-hide-controls>
                        </label>
                    </div>

                    <div class="section" data-desktop-controls>
                        <div class="position-group" data-position-group="navbar">
                            <span class="position-title">Top navbar position</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-600" max="600" step="1" value="0" data-position="navbar-x">
                                <output data-position-value="navbar-x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-400" max="400" step="1" value="0" data-position="navbar-y">
                                <output data-position-value="navbar-y">0px</output>
                            </label>
                        </div>
                        <div class="position-group" data-position-group="controls">
                            <span class="position-title">Pause / mute position</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-600" max="600" step="1" value="0" data-position="controls-x">
                                <output data-position-value="controls-x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-400" max="400" step="1" value="0" data-position="controls-y">
                                <output data-position-value="controls-y">0px</output>
                            </label>
                        </div>
                        <div class="position-group" data-position-group="arrows">
                            <span class="position-title">Like / arrows position</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-600" max="600" step="1" value="0" data-position="arrows-x">
                                <output data-position-value="arrows-x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-400" max="400" step="1" value="0" data-position="arrows-y">
                                <output data-position-value="arrows-y">0px</output>
                            </label>
                        </div>
                    </div>

                    <div class="section" data-mobile-controls hidden>
                        <span class="position-title">Device-specific video height</span>
                        <div class="device-switch" role="group" aria-label="Mobile browser preset">
                            <button class="device-button active" type="button" data-mobile-preset="iosSafari">iPhone 12<br>Safari</button>
                            <button class="device-button" type="button" data-mobile-preset="androidChrome">S25 Ultra<br>Chrome</button>
                        </div>
                        <dl class="measurements">
                            <dt>Device screen</dt><dd data-mobile-measurement="screen">390 × 844px</dd>
                            <dt>Browser UI</dt><dd data-mobile-measurement="browser">143px</dd>
                            <dt>Website viewport</dt><dd data-mobile-measurement="viewport">390 × 701px</dd>
                            <dt>Site navigation</dt><dd data-mobile-measurement="navigation">0px</dd>
                            <dt>Rendered video</dt><dd data-mobile-measurement="video">390 × 701px</dd>
                        </dl>
                    </div>

                    <div class="section" data-mobile-controls hidden>
                        <div class="label-row">
                            <label for="mobile-frame-size">Exact video height</label>
                            <span class="value" data-mobile-size-value>701px</span>
                        </div>
                        <input id="mobile-frame-size" type="range" min="240" max="780" step="1" value="701" data-mobile-frame-size>
                        <div class="label-row">
                            <label for="mobile-frame-radius">Mobile corner radius</label>
                            <span class="value" data-mobile-radius-value>0px</span>
                        </div>
                        <input id="mobile-frame-radius" type="range" min="0" max="80" step="1" value="0" data-mobile-radius>
                    </div>

                    <div class="section" data-mobile-controls hidden>
                        <label class="toggle-row">
                            <span>Hide bottom navigation</span>
                            <input type="checkbox" data-mobile-hide="navigation">
                        </label>
                        <label class="toggle-row">
                            <span>Hide pause / mute controls</span>
                            <input type="checkbox" data-mobile-hide="playback">
                        </label>
                        <label class="toggle-row">
                            <span>Hide side action buttons</span>
                            <input type="checkbox" data-mobile-hide="actions">
                        </label>
                        <label class="toggle-row">
                            <span>Bottom blur blend</span>
                            <input type="checkbox" data-mobile-bottom-blur>
                        </label>
                    </div>

                    <div class="section" data-mobile-controls hidden>
                        <span class="position-title">Landing profile content</span>
                        <label class="toggle-row">
                            <span>Hide “Vibhore Singhal”</span>
                            <input type="checkbox" data-mobile-profile-hide="name">
                        </label>
                        <label class="toggle-row">
                            <span>Hide bio text</span>
                            <input type="checkbox" data-mobile-profile-hide="bio">
                        </label>
                        <label class="toggle-row">
                            <span>Hide Bangalore / Delhi</span>
                            <input type="checkbox" data-mobile-profile-hide="locations">
                        </label>
                        <div class="label-row">
                            <label for="mobile-profile-scale">Group size</label>
                            <span class="value" data-mobile-profile-scale-value>100%</span>
                        </div>
                        <input id="mobile-profile-scale" type="range" min="50" max="180" step="1" value="100" data-mobile-profile-scale>
                        <div class="position-group">
                            <span class="position-title">Move group together</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-profile-position="x">
                                <output data-mobile-profile-position-value="x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-profile-position="y">
                                <output data-mobile-profile-position-value="y">0px</output>
                            </label>
                        </div>
                    </div>

                    <div class="section" data-mobile-controls hidden>
                        <div class="position-group">
                            <span class="position-title">Bottom navigation position</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-position="navigation-x">
                                <output data-mobile-position-value="navigation-x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-position="navigation-y">
                                <output data-mobile-position-value="navigation-y">0px</output>
                            </label>
                        </div>
                        <div class="position-group">
                            <span class="position-title">Pause / mute position</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-position="playback-x">
                                <output data-mobile-position-value="playback-x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-position="playback-y">
                                <output data-mobile-position-value="playback-y">0px</output>
                            </label>
                        </div>
                        <div class="position-group">
                            <span class="position-title">Side action buttons position</span>
                            <label class="position-control">
                                <span>X</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-position="actions-x">
                                <output data-mobile-position-value="actions-x">0px</output>
                            </label>
                            <label class="position-control">
                                <span>Y</span>
                                <input type="range" min="-300" max="300" step="1" value="0" data-mobile-position="actions-y">
                                <output data-mobile-position-value="actions-y">0px</output>
                            </label>
                        </div>
                    </div>

                    <div class="actions">
                        <button class="action primary" type="button" data-copy>Copy values</button>
                        <button class="action" type="button" data-reset>Reset all</button>
                    </div>
                    <p class="status" aria-live="polite" data-status></p>
                </div>
            </section>
            <div class="preview-backdrop" data-preview-backdrop hidden></div>
            <div class="mobile-previews" data-mobile-previews hidden>
                <div class="mobile-previews-inner" data-mobile-previews-inner>
                    ${phonePreviewMarkup('iosSafari')}
                    ${phonePreviewMarkup('androidChrome')}
                </div>
            </div>
        `;

        const panel = shadow.querySelector('.panel');
        const collapseButton = shadow.querySelector('.collapse');
        const activeVideo = shadow.querySelector('[data-active-video]');
        const colorInput = shadow.querySelector('[data-color]');
        const channelInputs = [...shadow.querySelectorAll('[data-channel]')];
        const sizeInput = shadow.querySelector('[data-frame-size]');
        const sizeValue = shadow.querySelector('[data-size-value]');
        const radiusInput = shadow.querySelector('[data-radius]');
        const radiusValue = shadow.querySelector('[data-radius-value]');
        const navbarToggle = shadow.querySelector('[data-hide-navbar]');
        const controlsToggle = shadow.querySelector('[data-hide-controls]');
        const positionInputs = [...shadow.querySelectorAll('[data-position]')];
        const previewModeButtons = [...shadow.querySelectorAll('[data-preview-mode]')];
        const haloInputs = [...shadow.querySelectorAll('[data-halo]')];
        const resumeButtonInputs = [...shadow.querySelectorAll('[data-resume-button]')];
        const desktopControlSections = [...shadow.querySelectorAll('[data-desktop-controls]')];
        const mobileControlSections = [...shadow.querySelectorAll('[data-mobile-controls]')];
        const previewBackdrop = shadow.querySelector('[data-preview-backdrop]');
        const mobilePreviews = shadow.querySelector('[data-mobile-previews]');
        const mobilePreviewsInner = shadow.querySelector('[data-mobile-previews-inner]');
        const mobilePreviewElements = Object.fromEntries(
            [...shadow.querySelectorAll('[data-preview-device]')].map(element => [element.dataset.previewDevice, element])
        );
        const mobilePreviewFrames = Object.fromEntries(
            [...shadow.querySelectorAll('[data-mobile-preview-frame]')].map(frame => [frame.dataset.mobilePreviewFrame, frame])
        );
        const browserBlurVideos = Object.fromEntries(
            [...shadow.querySelectorAll('[data-browser-blur-video]')].map(video => [video.dataset.browserBlurVideo, video])
        );
        const mobileHideInputs = [...shadow.querySelectorAll('[data-mobile-hide]')];
        const mobileBottomBlurInput = shadow.querySelector('[data-mobile-bottom-blur]');
        const mobilePositionInputs = [...shadow.querySelectorAll('[data-mobile-position]')];
        const mobileProfileHideInputs = [...shadow.querySelectorAll('[data-mobile-profile-hide]')];
        const mobileProfilePositionInputs = [...shadow.querySelectorAll('[data-mobile-profile-position]')];
        const mobileProfileScaleInput = shadow.querySelector('[data-mobile-profile-scale]');
        const mobileProfileScaleValue = shadow.querySelector('[data-mobile-profile-scale-value]');
        const mobileSizeInput = shadow.querySelector('[data-mobile-frame-size]');
        const mobileSizeValue = shadow.querySelector('[data-mobile-size-value]');
        const mobileRadiusInput = shadow.querySelector('[data-mobile-radius]');
        const mobileRadiusValue = shadow.querySelector('[data-mobile-radius-value]');
        const mobilePresetButtons = [...shadow.querySelectorAll('[data-mobile-preset]')];
        const mobileMeasurements = Object.fromEntries(
            [...shadow.querySelectorAll('[data-mobile-measurement]')].map(element => [element.dataset.mobileMeasurement, element])
        );
        const status = shadow.querySelector('[data-status]');
        let browserBlurSyncTimer = null;

        function updatePreviewScale() {
            const maxHeight = Math.max(...Object.values(mobilePresets).map(preset => preset.screenHeight + 22));
            const combinedWidth = Object.values(mobilePresets)
                .reduce((total, preset) => total + preset.screenWidth + 22, 0) + 24;
            const heightScale = (window.innerHeight - 32) / maxHeight;
            const widthScale = (window.innerWidth - 372) / combinedWidth;
            mobilePreviewsInner.style.setProperty('--preview-scale', String(clamp(Math.min(1, heightScale, widthScale), 0.35, 1)));
        }

        function updateMobileMeasurements() {
            const preset = mobilePresets[activeMobilePreset];
            const activeFrameElement = mobilePreviewFrames[activeMobilePreset];
            const activeDocument = previewDocuments[activeMobilePreset];
            const fallbackViewportHeight = preset.screenHeight - preset.browserTop - preset.browserBottom;
            const viewportWidth = activeFrameElement.contentWindow?.innerWidth || preset.screenWidth;
            const viewportHeight = activeFrameElement.contentWindow?.innerHeight || fallbackViewportHeight;
            const siteNavigationElement = activeDocument?.getElementById('mobileBottomNav');
            const siteNavigationStyle = siteNavigationElement ? activeDocument.defaultView.getComputedStyle(siteNavigationElement) : null;
            const siteNavigation = siteNavigationStyle && siteNavigationStyle.visibility !== 'hidden' && siteNavigationStyle.display !== 'none'
                ? siteNavigationElement.offsetHeight
                : 0;
            const activeFrame = activeDocument?.querySelector('.landing-section.active .landing-video-frame, .video-section.active .video-frame, .landing-video-frame, .video-frame');
            const frameRect = activeFrame?.getBoundingClientRect();
            const videoWidth = frameRect ? Math.round(frameRect.width) : preset.screenWidth;
            const videoHeight = frameRect ? Math.round(frameRect.height) : mobileState.videoHeightPx;

            mobileMeasurements.screen.textContent = `${preset.screenWidth} × ${preset.screenHeight}px`;
            mobileMeasurements.browser.textContent = `${preset.browserTop + preset.browserBottom}px`;
            mobileMeasurements.viewport.textContent = `${viewportWidth} × ${viewportHeight}px`;
            mobileMeasurements.navigation.textContent = `${siteNavigation}px`;
            mobileMeasurements.video.textContent = `${videoWidth} × ${videoHeight}px`;
        }

        function syncBrowserBlurVideos() {
            Object.entries(browserBlurVideos).forEach(([presetId, blurVideo]) => {
                const enabled = currentPreviewMode === 'mobile' && mobileStates[presetId].bottomBlurBlend;
                mobilePreviewElements[presetId].classList.toggle('bottom-blur-active', enabled);

                if (!enabled) {
                    if (blurVideo.dataset.sourceUrl) {
                        blurVideo.pause();
                        blurVideo.removeAttribute('src');
                        blurVideo.removeAttribute('data-source-url');
                        blurVideo.load();
                    }
                    return;
                }

                const previewDocument = previewDocuments[presetId];
                const sourceVideo = previewDocument?.querySelector(
                    '.landing-section.active video, .video-section.active video, .landing-section video, .video-section video'
                );
                const sourceUrl = sourceVideo?.currentSrc || sourceVideo?.src || sourceVideo?.dataset.src;
                if (!sourceVideo || !sourceUrl) return;

                if (blurVideo.dataset.sourceUrl !== sourceUrl) {
                    blurVideo.dataset.sourceUrl = sourceUrl;
                    blurVideo.src = sourceUrl;
                    blurVideo.load();
                }

                if (blurVideo.readyState >= 1 && Number.isFinite(sourceVideo.currentTime) &&
                    Math.abs(blurVideo.currentTime - sourceVideo.currentTime) > 0.45) {
                    blurVideo.currentTime = sourceVideo.currentTime;
                }

                if (!sourceVideo.paused) {
                    blurVideo.play().catch(() => {});
                } else {
                    blurVideo.pause();
                }
            });
        }

        function updateBrowserBlurSync() {
            const enabled = currentPreviewMode === 'mobile' &&
                Object.values(mobileStates).some(state => state.bottomBlurBlend);
            syncBrowserBlurVideos();

            if (enabled && !browserBlurSyncTimer) {
                browserBlurSyncTimer = setInterval(syncBrowserBlurVideos, 400);
            } else if (!enabled && browserBlurSyncTimer) {
                clearInterval(browserBlurSyncTimer);
                browserBlurSyncTimer = null;
            }
        }

        function setMobilePreviewPlayback(active) {
            Object.entries(previewDocuments).forEach(([presetId, previewDocument]) => {
                if (!previewDocument) return;
                const previewWindow = previewDocument.defaultView;

                if (!active) {
                    previewDocument.querySelectorAll('video').forEach(video => video.pause());
                    return;
                }

                const activeSection = previewDocument.querySelector('.landing-section.active, .video-section.active');
                const videoId = activeSection?.classList.contains('landing-section')
                    ? 'landing-video'
                    : activeSection?.getAttribute('data-video-id');
                if (videoId && typeof previewWindow.debouncedPlayVideo === 'function') {
                    previewWindow.debouncedPlayVideo(videoId);
                }
            });

            if (!active) {
                Object.values(browserBlurVideos).forEach(video => video.pause());
            }
        }

        function syncMobilePresetUI() {
            const preset = mobilePresets[activeMobilePreset];
            mobilePresetButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.mobilePreset === activeMobilePreset);
            });
            Object.entries(mobilePreviewElements).forEach(([presetId, previewElement]) => {
                const previewPreset = mobilePresets[presetId];
                previewElement.style.setProperty('--device-screen-width', `${previewPreset.screenWidth}px`);
                previewElement.style.setProperty('--device-screen-height', `${previewPreset.screenHeight}px`);
                previewElement.style.setProperty('--browser-top-height', `${previewPreset.browserTop}px`);
                previewElement.style.setProperty('--browser-bottom-height', `${previewPreset.browserBottom}px`);
                previewElement.querySelector('[data-phone-time]').textContent = previewPreset.statusTime;
            });

            mobileSizeInput.value = String(mobileState.videoHeightPx);
            mobileSizeValue.textContent = `${mobileState.videoHeightPx}px`;
            mobileRadiusInput.value = String(mobileState.cornerRadiusPx);
            mobileRadiusValue.textContent = `${mobileState.cornerRadiusPx}px`;
            mobileHideInputs.forEach(input => {
                const key = input.dataset.mobileHide;
                input.checked = key === 'navigation'
                    ? mobileState.hideNavigation
                    : key === 'playback'
                        ? mobileState.hidePlaybackControls
                        : mobileState.hideActionButtons;
            });
            mobileBottomBlurInput.checked = mobileState.bottomBlurBlend;
            mobilePositionInputs.forEach(input => {
                const [target, axis] = input.dataset.mobilePosition.split('-');
                input.value = String(mobileState.positions[target][axis]);
                shadow.querySelector(`[data-mobile-position-value="${input.dataset.mobilePosition}"]`).textContent = `${input.value}px`;
            });
            mobileProfileHideInputs.forEach(input => {
                const key = input.dataset.mobileProfileHide;
                input.checked = key === 'name'
                    ? mobileState.hideProfileName
                    : key === 'bio'
                        ? mobileState.hideProfileBio
                        : mobileState.hideProfileLocations;
            });
            mobileProfileScaleInput.value = String(mobileState.profileScalePercent);
            mobileProfileScaleValue.textContent = `${mobileState.profileScalePercent}%`;
            mobileProfilePositionInputs.forEach(input => {
                const axis = input.dataset.mobileProfilePosition;
                input.value = String(mobileState.profilePosition[axis]);
                shadow.querySelector(`[data-mobile-profile-position-value="${axis}"]`).textContent = `${input.value}px`;
            });
            updatePreviewScale();
            updateMobileMeasurements();
        }

        function ensureMobilePreviewsLoaded() {
            Object.entries(mobilePreviewFrames).forEach(([presetId, frame]) => {
                if (frame.src) return;
                const previewUrl = new URL(window.location.href);
                previewUrl.searchParams.set('experiment-preview', presetId);
                previewUrl.hash = '';
                frame.src = previewUrl.href;
            });
        }

        function installMobilePreviewControls(presetId) {
            const previewDocument = mobilePreviewFrames[presetId].contentDocument;
            if (!previewDocument) return;
            previewDocuments[presetId] = previewDocument;

            let style = previewDocument.getElementById('reelfolio-mobile-preview-overrides');
            if (!style) {
                style = previewDocument.createElement('style');
                style.id = 'reelfolio-mobile-preview-overrides';
                style.textContent = `
                    @media (max-width: 600px) {
                        :root[data-mobile-exp-enabled]:not([data-mobile-exp-hide-playback]) .control-bar {
                            display: flex !important;
                        }

                        :root[data-mobile-exp-size] .video-frame,
                        :root[data-mobile-exp-size] .landing-video-frame {
                            width: 100vw !important;
                            height: var(--mobile-exp-frame-height) !important;
                            aspect-ratio: unset !important;
                        }

                        :root[data-mobile-exp-radius] .video-frame,
                        :root[data-mobile-exp-radius] .landing-video-frame {
                            border-radius: var(--mobile-exp-radius) !important;
                        }

                        :root[data-mobile-exp-hide-navigation] #mobileBottomNav,
                        :root[data-mobile-exp-hide-playback] .control-bar,
                        :root[data-mobile-exp-hide-actions] #fixedNavArrows {
                            opacity: 0 !important;
                            visibility: hidden !important;
                            pointer-events: none !important;
                        }

                        :root[data-mobile-exp-position-navigation] #mobileBottomNav {
                            translate: var(--mobile-exp-navigation-x) var(--mobile-exp-navigation-y) !important;
                        }

                        :root[data-mobile-exp-position-playback] .control-bar {
                            translate: var(--mobile-exp-playback-x) var(--mobile-exp-playback-y) !important;
                        }

                        :root[data-mobile-exp-position-actions] #fixedNavArrows {
                            translate: var(--mobile-exp-actions-x) var(--mobile-exp-actions-y) !important;
                        }

                        :root[data-mobile-exp-hide-profile-name] .landing-name,
                        :root[data-mobile-exp-hide-profile-bio] .landing-bio,
                        :root[data-mobile-exp-hide-profile-locations] .landing-locations {
                            display: none !important;
                        }

                        :root[data-mobile-exp-position-profile] .landing-profile-info {
                            translate: var(--mobile-exp-profile-x) var(--mobile-exp-profile-y) !important;
                        }

                        :root[data-mobile-exp-scale-profile] .landing-profile-info {
                            scale: var(--mobile-exp-profile-scale) !important;
                            transform-origin: left bottom !important;
                        }

                        :root[data-mobile-exp-bottom-blur] .video-frame::before,
                        :root[data-mobile-exp-bottom-blur] .landing-video-frame::before {
                            content: '' !important;
                            position: absolute !important;
                            left: 0 !important;
                            right: 0 !important;
                            bottom: 0 !important;
                            height: clamp(36px, 9vh, 72px) !important;
                            z-index: 60 !important;
                            pointer-events: none !important;
                            background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.5)) !important;
                            backdrop-filter: blur(14px) !important;
                            -webkit-backdrop-filter: blur(14px) !important;
                            mask-image: linear-gradient(to bottom, transparent, black 45%) !important;
                            -webkit-mask-image: linear-gradient(to bottom, transparent, black 45%) !important;
                        }
                    }
                `;
                previewDocument.head.appendChild(style);
            }

            applyMobileState();
            applyHaloState();
        }

        function applyMobileStateToRoot(targetRoot, state, enabled) {
            targetRoot.toggleAttribute('data-mobile-exp-enabled', enabled);
            targetRoot.toggleAttribute('data-mobile-exp-size', enabled && state.sizeChanged);
            targetRoot.toggleAttribute('data-mobile-exp-radius', enabled && state.radiusChanged);
            targetRoot.toggleAttribute('data-mobile-exp-hide-navigation', enabled && state.hideNavigation);
            targetRoot.toggleAttribute('data-mobile-exp-hide-playback', enabled && state.hidePlaybackControls);
            targetRoot.toggleAttribute('data-mobile-exp-hide-actions', enabled && state.hideActionButtons);
            targetRoot.toggleAttribute('data-mobile-exp-hide-profile-name', enabled && state.hideProfileName);
            targetRoot.toggleAttribute('data-mobile-exp-hide-profile-bio', enabled && state.hideProfileBio);
            targetRoot.toggleAttribute('data-mobile-exp-hide-profile-locations', enabled && state.hideProfileLocations);
            targetRoot.toggleAttribute('data-mobile-exp-bottom-blur', enabled && state.bottomBlurBlend);
            const profileMoved = state.profilePosition.x !== 0 || state.profilePosition.y !== 0;
            targetRoot.toggleAttribute('data-mobile-exp-position-profile', enabled && profileMoved);
            targetRoot.toggleAttribute('data-mobile-exp-scale-profile', enabled && state.profileScalePercent !== 100);
            targetRoot.style.setProperty('--mobile-exp-frame-height', `${state.videoHeightPx}px`);
            targetRoot.style.setProperty('--mobile-exp-radius', `${state.cornerRadiusPx}px`);
            targetRoot.style.setProperty('--mobile-exp-profile-x', `${state.profilePosition.x}px`);
            targetRoot.style.setProperty('--mobile-exp-profile-y', `${state.profilePosition.y}px`);
            targetRoot.style.setProperty('--mobile-exp-profile-scale', String(state.profileScalePercent / 100));
            Object.entries(state.positions).forEach(([target, position]) => {
                const moved = position.x !== 0 || position.y !== 0;
                targetRoot.toggleAttribute(`data-mobile-exp-position-${target}`, enabled && moved);
                targetRoot.style.setProperty(`--mobile-exp-${target}-x`, `${position.x}px`);
                targetRoot.style.setProperty(`--mobile-exp-${target}-y`, `${position.y}px`);
            });
        }

        function applyMobileState() {
            applyMobileStateToRoot(ROOT, mobileState, currentPreviewMode === 'mobile');
            Object.entries(previewDocuments).forEach(([presetId, previewDocument]) => {
                if (previewDocument) applyMobileStateToRoot(previewDocument.documentElement, mobileStates[presetId], true);
            });
            updateBrowserBlurSync();
            requestAnimationFrame(updateMobileMeasurements);
        }

        function applyHaloStateToRoot(targetRoot) {
            targetRoot.style.setProperty('--play-halo-size', `${haloState.size}px`);
            targetRoot.style.setProperty('--play-halo-darkness', String(haloState.darkness / 100));
            targetRoot.style.setProperty('--play-halo-blur', `${haloState.blur}px`);
        }

        function applyHaloState() {
            applyHaloStateToRoot(ROOT);
            Object.values(previewDocuments).forEach(previewDocument => {
                if (previewDocument) applyHaloStateToRoot(previewDocument.documentElement);
            });
        }

        function applyResumeButtonState() {
            ROOT.style.setProperty('--resume-font-size', `${resumeButtonState.fontSize}px`);
            ROOT.style.setProperty('--resume-font-weight', String(resumeButtonState.fontWeight));
            ROOT.style.setProperty('--resume-letter-spacing', `${resumeButtonState.letterSpacing}px`);
            ROOT.style.setProperty('--resume-icon-gap', `${resumeButtonState.iconGap}px`);
            ROOT.style.setProperty('--landing-actions-gap', `${resumeButtonState.buttonGap}px`);
            ROOT.style.setProperty('--resume-padding-x', `${resumeButtonState.paddingX}px`);
            ROOT.style.setProperty('--landing-action-height', `${resumeButtonState.height}px`);
        }

        function setPreviewMode(mode) {
            const isMobile = mode === 'mobile';
            const showMockup = isMobile && window.innerWidth > 600;
            currentPreviewMode = mode;
            previewModeButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.previewMode === mode);
            });
            desktopControlSections.forEach(section => {
                section.hidden = isMobile;
            });
            mobileControlSections.forEach(section => {
                section.hidden = !isMobile;
            });
            mobilePreviews.hidden = !showMockup;
            previewBackdrop.hidden = !showMockup;

            if (showMockup) {
                updatePreviewScale();
                ensureMobilePreviewsLoaded();
            }
            setMobilePreviewPlayback(isMobile);
            applyMobileState();
        }

        previewModeButtons.forEach(button => {
            button.addEventListener('click', () => setPreviewMode(button.dataset.previewMode));
        });

        haloInputs.forEach(input => {
            input.addEventListener('input', () => {
                const property = input.dataset.halo;
                haloState[property] = Number(input.value);
                const suffix = property === 'darkness' ? '%' : 'px';
                shadow.querySelector(`[data-halo-value="${property}"]`).textContent = `${input.value}${suffix}`;
                applyHaloState();
            });
        });

        resumeButtonInputs.forEach(input => {
            input.addEventListener('input', () => {
                const property = input.dataset.resumeButton;
                resumeButtonState[property] = Number(input.value);
                const unitless = property === 'fontWeight';
                shadow.querySelector(`[data-resume-button-value="${property}"]`).textContent =
                    `${input.value}${unitless ? '' : 'px'}`;
                applyResumeButtonState();
            });
        });

        Object.entries(mobilePreviewFrames).forEach(([presetId, frame]) => {
            frame.addEventListener('load', () => installMobilePreviewControls(presetId));
        });

        function updateSharedMobileStates(update) {
            Object.values(mobileStates).forEach(update);
            mobileState = mobileStates[activeMobilePreset];
        }

        mobilePresetButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeMobilePreset = button.dataset.mobilePreset;
                mobileState = mobileStates[activeMobilePreset];
                syncMobilePresetUI();
                applyMobileState();
            });
        });

        mobileHideInputs.forEach(input => {
            input.addEventListener('change', () => {
                updateSharedMobileStates(state => {
                    if (input.dataset.mobileHide === 'navigation') state.hideNavigation = input.checked;
                    if (input.dataset.mobileHide === 'playback') state.hidePlaybackControls = input.checked;
                    if (input.dataset.mobileHide === 'actions') state.hideActionButtons = input.checked;
                });
                applyMobileState();
            });
        });

        mobileBottomBlurInput.addEventListener('change', () => {
            updateSharedMobileStates(state => {
                state.bottomBlurBlend = mobileBottomBlurInput.checked;
            });
            applyMobileState();
        });

        mobilePositionInputs.forEach(input => {
            input.addEventListener('input', () => {
                const [target, axis] = input.dataset.mobilePosition.split('-');
                updateSharedMobileStates(state => {
                    state.positions[target][axis] = Number(input.value);
                });
                shadow.querySelector(`[data-mobile-position-value="${input.dataset.mobilePosition}"]`).textContent = `${input.value}px`;
                applyMobileState();
            });
        });

        mobileSizeInput.addEventListener('input', () => {
            mobileState.sizeChanged = true;
            mobileState.videoHeightPx = Number(mobileSizeInput.value);
            mobileSizeValue.textContent = `${mobileSizeInput.value}px`;
            applyMobileState();
        });

        mobileRadiusInput.addEventListener('input', () => {
            updateSharedMobileStates(state => {
                state.radiusChanged = true;
                state.cornerRadiusPx = Number(mobileRadiusInput.value);
            });
            mobileRadiusValue.textContent = `${mobileRadiusInput.value}px`;
            applyMobileState();
        });

        mobileProfileHideInputs.forEach(input => {
            input.addEventListener('change', () => {
                updateSharedMobileStates(state => {
                    if (input.dataset.mobileProfileHide === 'name') state.hideProfileName = input.checked;
                    if (input.dataset.mobileProfileHide === 'bio') state.hideProfileBio = input.checked;
                    if (input.dataset.mobileProfileHide === 'locations') state.hideProfileLocations = input.checked;
                });
                applyMobileState();
            });
        });

        mobileProfileScaleInput.addEventListener('input', () => {
            updateSharedMobileStates(state => {
                state.profileScalePercent = Number(mobileProfileScaleInput.value);
            });
            mobileProfileScaleValue.textContent = `${mobileProfileScaleInput.value}%`;
            applyMobileState();
        });

        mobileProfilePositionInputs.forEach(input => {
            input.addEventListener('input', () => {
                const axis = input.dataset.mobileProfilePosition;
                updateSharedMobileStates(state => {
                    state.profilePosition[axis] = Number(input.value);
                });
                shadow.querySelector(`[data-mobile-profile-position-value="${axis}"]`).textContent = `${input.value}px`;
                applyMobileState();
            });
        });

        function setStatus(message) {
            status.textContent = message;
            clearTimeout(setStatus.timer);
            setStatus.timer = setTimeout(() => {
                status.textContent = '';
            }, 1800);
        }

        function syncColorControls() {
            const section = getCurrentSection();
            if (!section) return;
            const id = getSectionId(section);
            const color = section.getAttribute('data-bg-color') || getComputedStyle(document.getElementById('bgLayer')).backgroundColor;
            const rgb = parseColor(color);
            activeVideo.textContent = id;
            colorInput.value = rgbToHex(rgb);
            channelInputs.forEach((input, index) => {
                input.value = rgb[index];
            });
        }

        function syncFrameControls() {
            const frame = getFrame(getCurrentSection());
            if (!frame) return;
            const styles = getComputedStyle(frame);

            if (!sizeWasChanged) {
                const heightVh = clamp(Math.round(frame.getBoundingClientRect().height / window.innerHeight * 100), 35, 110);
                sizeInput.value = heightVh;
                sizeValue.textContent = `${heightVh}vh`;
            }

            if (!radiusWasChanged) {
                const radius = clamp(Math.round(parseFloat(styles.borderTopLeftRadius)), 0, 80);
                radiusInput.value = radius;
                radiusValue.textContent = `${radius}px`;
            }
        }

        function syncForCurrentSection(force = false) {
            const currentId = getSectionId(getCurrentSection());
            if (!force && currentId === lastSyncedSectionId) return;
            lastSyncedSectionId = currentId;
            syncColorControls();
            syncFrameControls();
        }

        function applyColor(rgb) {
            const section = getCurrentSection();
            if (!section) return;
            const id = getSectionId(section);
            const value = `rgb(${rgb.join(', ')})`;

            if (!originalColors.has(id)) {
                originalColors.set(id, section.getAttribute('data-bg-color') || '');
            }
            section.setAttribute('data-bg-color', value);
            colorOverrides.set(id, value);

            const bg = document.getElementById('bgLayer');
            if (bg) bg.style.backgroundColor = value;
        }

        function applyChannels() {
            const rgb = channelInputs.map(input => clamp(Math.round(input.value), 0, 255));
            channelInputs.forEach((input, index) => {
                input.value = rgb[index];
            });
            colorInput.value = rgbToHex(rgb);
            applyColor(rgb);
        }

        colorInput.addEventListener('input', () => {
            const rgb = parseColor(colorInput.value);
            channelInputs.forEach((input, index) => {
                input.value = rgb[index];
            });
            applyColor(rgb);
        });

        channelInputs.forEach(input => {
            input.addEventListener('input', applyChannels);
        });

        sizeInput.addEventListener('input', () => {
            sizeWasChanged = true;
            ROOT.dataset.reelfolioExpSize = '';
            ROOT.style.setProperty('--reelfolio-exp-portrait-width', `${Number(sizeInput.value) * 9 / 16}vh`);
            ROOT.style.setProperty('--reelfolio-exp-landscape-width', `${Number(sizeInput.value) * 16 / 9}vh`);
            sizeValue.textContent = `${sizeInput.value}vh`;
        });

        radiusInput.addEventListener('input', () => {
            radiusWasChanged = true;
            ROOT.dataset.reelfolioExpRadius = '';
            ROOT.style.setProperty('--reelfolio-exp-radius', `${radiusInput.value}px`);
            radiusValue.textContent = `${radiusInput.value}px`;
        });

        navbarToggle.addEventListener('change', () => {
            ROOT.toggleAttribute('data-reelfolio-exp-hide-navbar', navbarToggle.checked);
        });

        controlsToggle.addEventListener('change', () => {
            ROOT.toggleAttribute('data-reelfolio-exp-hide-controls', controlsToggle.checked);
        });

        const positionTargets = {
            navbar: 'data-reelfolio-exp-position-navbar',
            controls: 'data-reelfolio-exp-position-controls',
            arrows: 'data-reelfolio-exp-position-arrows'
        };

        positionInputs.forEach(input => {
            input.addEventListener('input', () => {
                const [target, axis] = input.dataset.position.split('-');
                const value = `${input.value}px`;
                ROOT.setAttribute(positionTargets[target], '');
                ROOT.style.setProperty(`--reelfolio-exp-${target}-${axis}`, value);
                shadow.querySelector(`[data-position-value="${input.dataset.position}"]`).textContent = value;
            });
        });

        collapseButton.addEventListener('click', () => {
            const collapsed = panel.classList.toggle('collapsed');
            collapseButton.textContent = collapsed ? '+' : '−';
            collapseButton.setAttribute('aria-expanded', String(!collapsed));
            collapseButton.setAttribute('aria-label', collapsed ? 'Expand controller' : 'Collapse controller');
        });

        shadow.querySelector('[data-copy]').addEventListener('click', async () => {
            const payload = {
                playButtonHalo: {
                    sizePx: haloState.size,
                    darknessPercent: haloState.darkness,
                    blurPx: haloState.blur
                },
                resumeButton: {
                    fontSizePx: resumeButtonState.fontSize,
                    fontWeight: resumeButtonState.fontWeight,
                    letterSpacingPx: resumeButtonState.letterSpacing,
                    iconTextGapPx: resumeButtonState.iconGap,
                    buttonGapPx: resumeButtonState.buttonGap,
                    horizontalPaddingPx: resumeButtonState.paddingX,
                    heightPx: resumeButtonState.height
                },
                frameHeightVh: Number(sizeInput.value),
                cornerRadiusPx: Number(radiusInput.value),
                hideTopNavbar: navbarToggle.checked,
                hidePauseMuteControls: controlsToggle.checked,
                positionsPx: {
                    topNavbar: {
                        x: Number(shadow.querySelector('[data-position="navbar-x"]').value),
                        y: Number(shadow.querySelector('[data-position="navbar-y"]').value)
                    },
                    pauseMuteControls: {
                        x: Number(shadow.querySelector('[data-position="controls-x"]').value),
                        y: Number(shadow.querySelector('[data-position="controls-y"]').value)
                    },
                    likeAndArrows: {
                        x: Number(shadow.querySelector('[data-position="arrows-x"]').value),
                        y: Number(shadow.querySelector('[data-position="arrows-y"]').value)
                    }
                },
                mobile: {
                    activePreset: activeMobilePreset,
                    bottomBlurBlend: mobileState.bottomBlurBlend,
                    sharedLandingProfile: {
                        hideName: mobileState.hideProfileName,
                        hideBio: mobileState.hideProfileBio,
                        hideLocations: mobileState.hideProfileLocations,
                        scalePercent: mobileState.profileScalePercent,
                        positionPx: { ...mobileState.profilePosition }
                    },
                    presets: Object.fromEntries(Object.entries(mobileStates).map(([presetId, state]) => [
                        presetId,
                        {
                            videoHeightPx: state.videoHeightPx,
                            cornerRadiusPx: state.cornerRadiusPx,
                            hideBottomNavigation: state.hideNavigation,
                            hidePauseMuteControls: state.hidePlaybackControls,
                            hideSideActionButtons: state.hideActionButtons,
                            positionsPx: {
                                bottomNavigation: { ...state.positions.navigation },
                                pauseMuteControls: { ...state.positions.playback },
                                sideActionButtons: { ...state.positions.actions }
                            }
                        }
                    ]))
                },
                videoBackgrounds: Object.fromEntries(colorOverrides)
            };
            const text = `ReelFolio visual experiment values:\n${JSON.stringify(payload, null, 2)}`;

            try {
                await navigator.clipboard.writeText(text);
                setStatus('Values copied');
            } catch (error) {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const copied = document.execCommand('copy');
                textarea.remove();
                setStatus(copied ? 'Values copied' : 'Copy failed');
            }
        });

        shadow.querySelector('[data-reset]').addEventListener('click', () => {
            ROOT.removeAttribute('data-reelfolio-exp-size');
            ROOT.removeAttribute('data-reelfolio-exp-radius');
            ROOT.removeAttribute('data-reelfolio-exp-hide-navbar');
            ROOT.removeAttribute('data-reelfolio-exp-hide-controls');
            ROOT.removeAttribute('data-reelfolio-exp-position-navbar');
            ROOT.removeAttribute('data-reelfolio-exp-position-controls');
            ROOT.removeAttribute('data-reelfolio-exp-position-arrows');
            ROOT.style.removeProperty('--reelfolio-exp-portrait-width');
            ROOT.style.removeProperty('--reelfolio-exp-landscape-width');
            ROOT.style.removeProperty('--reelfolio-exp-radius');
            Object.assign(haloState, haloDefaults);
            haloInputs.forEach(input => {
                const property = input.dataset.halo;
                input.value = String(haloState[property]);
                const suffix = property === 'darkness' ? '%' : 'px';
                shadow.querySelector(`[data-halo-value="${property}"]`).textContent = `${haloState[property]}${suffix}`;
            });
            applyHaloState();
            Object.assign(resumeButtonState, resumeButtonDefaults);
            resumeButtonInputs.forEach(input => {
                const property = input.dataset.resumeButton;
                input.value = String(resumeButtonState[property]);
                const unitless = property === 'fontWeight';
                shadow.querySelector(`[data-resume-button-value="${property}"]`).textContent =
                    `${resumeButtonState[property]}${unitless ? '' : 'px'}`;
            });
            applyResumeButtonState();
            ['navbar', 'controls', 'arrows'].forEach(target => {
                ROOT.style.removeProperty(`--reelfolio-exp-${target}-x`);
                ROOT.style.removeProperty(`--reelfolio-exp-${target}-y`);
            });

            originalColors.forEach((color, id) => {
                const section = document.querySelector(`[data-video-id="${CSS.escape(id)}"]`);
                if (section) section.setAttribute('data-bg-color', color);
            });
            originalColors.clear();
            colorOverrides.clear();
            sizeWasChanged = false;
            radiusWasChanged = false;
            navbarToggle.checked = true;
            controlsToggle.checked = false;
            positionInputs.forEach(input => {
                input.value = '0';
                shadow.querySelector(`[data-position-value="${input.dataset.position}"]`).textContent = '0px';
            });
            mobileStates.iosSafari = createMobileState(701);
            mobileStates.androidChrome = createMobileState(723);
            activeMobilePreset = 'iosSafari';
            mobileState = mobileStates[activeMobilePreset];
            syncMobilePresetUI();
            applyMobileState();

            const section = getCurrentSection();
            const bg = document.getElementById('bgLayer');
            if (section && bg) bg.style.backgroundColor = section.getAttribute('data-bg-color');
            syncForCurrentSection(true);
            setStatus('Experiments reset');
        });

        const scrollContainer = document.getElementById('mainScrollContainer');
        if (scrollContainer && 'onscrollend' in scrollContainer) {
            scrollContainer.addEventListener('scrollend', syncForCurrentSection, { passive: true });
        } else if (scrollContainer) {
            let experimentScrollSyncTimer = null;
            scrollContainer.addEventListener('scroll', () => {
                clearTimeout(experimentScrollSyncTimer);
                experimentScrollSyncTimer = setTimeout(syncForCurrentSection, 140);
            }, { passive: true });
        }

        window.addEventListener('resize', () => {
            if (!sizeWasChanged || !radiusWasChanged) syncFrameControls();
            if (currentPreviewMode === 'mobile') {
                const showMockup = window.innerWidth > 600;
                mobilePreviews.hidden = !showMockup;
                previewBackdrop.hidden = !showMockup;
                if (showMockup) {
                    updatePreviewScale();
                    ensureMobilePreviewsLoaded();
                }
            }
        }, { passive: true });

        syncMobilePresetUI();
        applyHaloState();
        applyResumeButtonState();
        syncForCurrentSection();
    }

    function waitForRenderedSections() {
        if (document.querySelector('.landing-section, .video-section')) {
            initialize();
            return;
        }

        const target = document.getElementById('tabsContainer') || document.body;
        const observer = new MutationObserver(() => {
            if (document.querySelector('.landing-section, .video-section')) {
                observer.disconnect();
                initialize();
            }
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForRenderedSections, { once: true });
    } else {
        waitForRenderedSections();
    }
})();
