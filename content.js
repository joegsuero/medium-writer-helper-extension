const styleId = "medium-dark-mode-style";

function isMediumPage() {
  // Check common Medium meta tags
  const metaMedium = document.querySelector('meta[property="al:ios:app_name"][content="Medium"]') ||
                     document.querySelector('meta[name="twitter:app:name:iphone"][content="Medium"]') ||
                     document.querySelector('meta[property="og:site_name"][content="Medium"]') ||
                     document.querySelector('meta[name="twitter:site"][content="@Medium"]');
  
  if (metaMedium) return true;

  // Check for specific Medium UI elements as fallback
  const hasMetabar = document.querySelector('.metabar') || 
                      document.querySelector('.js-metabar') ||
                      document.querySelector('[data-testid="headerMediumLogo"]') ||
                      document.querySelector('.site-main');
  
  return !!hasMetabar;
}

function applyDarkMode(enabled) {
  if (enabled && !isMediumPage()) return;
  
  let style = document.getElementById(styleId);
  if (enabled) {
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        html, body, .screenContent, main, article, .r, .site-main {
          background-color: #121212 !important;
          color: #ffffff !important;
        }
        div, section, header, footer, nav, aside {
          background-color: transparent !important;
          color: inherit !important;
        }
        h1, h2, h3, h4, h5, h6, p, blockquote, li, span, a {
          color: #e5e5e5 !important;
        }
        /* Metabar / Toolbar & Sticky Navs & AppBars */
        .metabar, .js-metabarSpacer, .metabar-inner, 
        .dw.n.dx.dy.dz.ea, .o.q, .kv.y, .kw.bw.y.br,
        .y.z.ab.ac.c, .bc.p.af.o.bd.be, .ae.p.af.ag.ah.ai.aj.ak.al.j.e.am.an {
          background-color: #121212 !important;
          border-color: #333 !important;
          opacity: 1 !important;
        }
        
        /* Force Medium Logo to White */
        svg path[fill="#242424"], svg path[d*="M29.57"], .siteNav-logo svg path {
          fill: #ffffff !important;
        }
        
        /* Status Labels (Draft, Saved, etc.) */
        .js-metabarMessage, .u-textColorDarker, .u-textColorNormal, 
        .js-metabarMessage span, .u-textColorDarkest {
          color: #bbbbbb !important;
        }
        
        /* Side Labels (Title, Subtitle, Kicker) */
        .js-titleLabel, .js-subtitleLabel, .js-kickerLabel, .u-textColorNormal {
          color: #eeeeee !important;
        }

        .svgIcon-use, .svgIcon, .metabar-block svg, svg[width="24"][height="24"] {
          fill: #e5e5e5 !important;
          color: #e5e5e5 !important;
        }
        /* Code Blocks (Pre) */
        pre, .graf--pre, .graf--preV2 {
          background-color: #1e1e1e !important;
          color: #d4d4d4 !important;
          border: 1px solid #333 !important;
          padding: 15px !important;
          border-radius: 4px !important;
          margin: 1em 0 !important;
          overflow-x: auto !important;
        }
        /* Inline Code (Modern & Subtle) */
        code, .markup--code {
          background-color: #2d2d2d !important;
          color: #e5e5e5 !important;
          padding: 2px 5px !important;
          border-radius: 3px !important;
          font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace !important;
          font-size: 0.9em !important;
          border: 1px solid #444 !important;
          vertical-align: middle !important;
        }
        /* HLJS Syntax Highlighting overrides */
        .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #569cd6 !important; }
        .hljs-string, .hljs-doctag { color: #ce9178 !important; }
        .hljs-comment, .hljs-quote { color: #6a9955 !important; }
        .hljs-number, .hljs-literal { color: #b5cea8 !important; }
        .hljs-title, .hljs-section { color: #dcdcaa !important; }
        
        /* Editor UI Panels */
        .highlightMenu, .inlineTooltip, .drawer, .popover {
          background-color: #252525 !important;
          border: 1px solid #444 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .button--chromeless, .buttonSet button {
          color: #e5e5e5 !important;
        }
        
        /* Invert images slightly or keep them clear */
        img { opacity: 0.8; }
      `;
      document.documentElement.appendChild(style);
    }
  } else {
    if (style) {
      style.remove();
    }
  }
}

// Initial application
chrome.storage.local.get("darkMode", (data) => {
  if (data.darkMode) {
    applyDarkMode(true);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleDarkMode") {
    applyDarkMode(message.enabled);
  } else if (message.action === "checkMedium") {
    sendResponse({ 
      isMedium: isMediumPage(),
      isEditor: !!(document.querySelector('.editable') || document.querySelector('[contenteditable="true"]') || window.location.href.includes('edit'))
    });
  }
  return true; // Keep channel open for async response
});
