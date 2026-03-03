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

        /* Metabar Icons only */
        .metabar .svgIcon-use, .metabar .svgIcon, .metabar-block svg {
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
        
        /* Editor UI Panels & Floating Menus (Overflow, Popper, etc.) */
        .highlightMenu, .drawer, .popover, 
        .fl.bq, .ho.bq, .ho.aid.eu, .aim.agg.ac.abn.cv,
        [id*="OverflowMenu"], ul.aim, li.ain, .bg.b.bh.ee.ain {
          background-color: #1e1e1e !important;
          border: 1px solid #444 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          color: #eeeeee !important;
        }

        /* Inline Tooltip (+) Menu Icons Fix */
        .inlineTooltip-menu svg path, 
        .inlineTooltip-menu svg rect:not([rx="15.5"]), 
        .inlineTooltip-menu svg circle {
          fill: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* The main '+' toggle icon and circle */
        .inlineTooltip button.js-inlineTooltipControl {
          border: 1px solid #ffffff !important;
          background-color: rgba(0,0,0,0.5) !important;
        }
        .inlineTooltip button.js-inlineTooltipControl svg path {
          fill: #ffffff !important;
        }

        .ah.ai.aj.fb.al.am.an.ao.ap.aq.ar.as.at.au.av, .ah.ai.aj.fb.al.am {
            color: #eeeeee !important;
            background: transparent !important;
        }

        .ah.ai.aj.fb.al.am.an.ao.ap.aq.ar.as.at.au.av:hover {
            background-color: #2a2a2a !important;
        }

        /* Menu Icons */
        svg.ax path, .ax path, .ax circle, .ax rect {
          fill: #e5e5e5 !important;
        }
        
        .button--chromeless, .buttonSet button {
          color: #e5e5e5 !important;
        }
        
        /* Invert images slightly or keep them clear */
        img { opacity: 0.8; }

        /* Image Captions Fix */
        figcaption.imageCaption {
          color: #ffffff !important;
        }

        /* Link Underlines Fix (Refined: Only in Editor) */
        .editable a, [contenteditable="true"] a, .postArticle-content a, .markup--anchor {
          text-decoration: none !important;
          border-bottom: 1px solid #ffffff !important;
          box-shadow: none !important;
          background-image: none !important;
        }

        /* Ensure Nav/AppBar links don't have the underline */
        .metabar a, .js-metabar a, nav a, header a {
          border-bottom: none !important;
          text-decoration: none !important;
          box-shadow: none !important;
        }

        /* Tags Multi-Select Menu (Dropdown Fix) */
        .ep.gm.if.ig, #tagMultiSelectMenu, .ih.gm, ul.im {
          background-color: #1e1e1e !important;
          border: 1px solid #444 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          opacity: 1 !important;
        }

        /* Tags List Items & Text */
        #tagMultiSelectMenu button, #tagMultiSelectMenu span, #tagMultiSelectMenu p, .im.in.o.hv.db p {
          color: #eeeeee !important;
          background-color: transparent !important;
        }

        #tagMultiSelectMenu button:hover {
          background-color: #2a2a2a !important;
        }

        /* Topic Input Field & Tags Elements Fix */
        input[role="combobox"], .gq.fp.gr.gs.gt.gu.fq.gv, .io.ip.iq.go.o.p.ir.is p {
          color: #ffffff !important;
          background-color: transparent !important;
        }

        /* Selected Topics / Tags Chips */
        .io.ip.iq.go.o.p.ir.is {
          background-color: #2a2a2a !important;
          border: 1px solid #444 !important;
          color: #eeeeee !important;
        }

        /* Publication and Date Picker Buttons Refined */
        button.eo.gm.jj, button.eo.gm.io, button.ea.hu.ec, button.dj.be.gb.bg, button.hu.ec.ed {
          background-color: #2a2a2a !important;
          color: #ffffff !important;
          border: 1px solid #444 !important;
        }

        /* Specific Scheduling Buttons Styles */
        button.hm.dz, button.hr.dz {
          padding-inline: 10px !important;
          border-radius: 25px !important;
        }

        /* Date Picker Icons */
        .jr.ar.jn.io svg path, .jk.jl.jm svg path, .jr svg path, .ip.iq.ir svg path {
          stroke: #ffffff !important;
        }

        /* Publication Panel Text & Labels */
        .jq p, .jn.jo p, .jp.ar p, .o.cd.ch.cl.cp.ct.ht button, 
        #date-field-schedule-a-time-to-publish {
          color: #ffffff !important;
        }

        /* Ensure Date Picker Button has correct background */
        .eq button[aria-haspopup="menu"] {
          background-color: #2a2a2a !important;
        }

        /* Date Picker Popover Dropdown */
        #date-picker, .jh.ji.ft, .ep.gm.je.jf.jg.gw {
          background-color: #1e1e1e !important;
          border: 1px solid #444 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          opacity: 1 !important;
        }

        /* Date Picker Dropdown Text and Elements */
        #date-picker h2, #date-picker p, #date-picker span {
          color: #eeeeee !important;
        }

        #date-picker button:not([disabled]):hover {
          background-color: #2a2a2a !important;
        }

        /* User Profile Menu Dropdown (Refined) */
        .df.rd.sa.rb.c.mo.sb, .hz.rd, .hz.rq.bw,
        .df.kp.kq.kr.c.ks.kt, .ku.kp, .ku.kv.bw,
        [data-popper-placement="bottom-end"] {
          background-color: #1e1e1e !important;
          border: 1px solid #444 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          opacity: 1 !important;
        }

        .hz.rq.bw p, .hz.rq.bw span, .hz.rq.bw div,
        .ku.kv.bw p, .ku.kv.bw span, .ku.kv.bw div {
          color: #eeeeee !important;
        }

        .hz.rq.bw a:hover, .hz.rq.bw button:hover,
        .ku.kv.bw a:hover, .ku.kv.bw button:hover {
          background-color: #2a2a2a !important;
        }

        /* Edit Profile Page / Modal */
        .hh.lm.ln.lo, .ly.bq.lz, .mi.kz.mj {
          background-color: #121212 !important;
          color: #ffffff !important;
        }

        /* Edit Profile Text, Labels, and Inputs */
        .bg.fx.nu.nv, .nz.bl, .bg.b.bh.ab.dy, .bg.b.dz.ab.dy,
        .bg.b.bh.ab.bl, .bg.b.bh.ab.jj, .bg.b.bh.ab.ks,
        .nw.m p, .kz.m p, .kz.ac.jh.es p, .bi.ac.jh label,
        .as.b.ck.an, .as.b.go.gp {
          color: #ffffff !important;
        }

        .ac.bi.cv.ke.bq.oa.ob.fb input,
        .ac.bi.cv.ke.bq.oa.ob.fb textarea,
        input.od.al.aj.an.oe.of,
        textarea.od.al.aj.an.oe.of {
          background-color: #1e1e1e !important;
          color: #ffffff !important;
          border-color: #444 !important;
        }

        /* Pronouns / Multi-select Pills */
        .css-192hq3n-multiValue {
          background-color: #333 !important;
          color: #ffffff !important;
        }

        .css-1xdsud6 {
          color: #ffffff !important;
        }

        /* Close/SVG Icons */
        .eb.dy.eu.et, .eb.dy.eu.et path {
          stroke: #ffffff !important;
        }

        /* Story Actions Bar (Claps, Comments, Share) */
        .ac.cw.ko.kp.kq.kr.ks.kt.ku.kv.kw.kx.ky.kz.la.lb.lc.ld,
        .ac.cw, [data-testid="storyActionsBar"] {
          background-color: transparent !important;
          background: transparent !important;
          box-shadow: none !important;
          border-top: 1px solid #444 !important;
          border-bottom: 1px solid #444 !important;
          border-left: none !important;
          border-right: none !important;
        }

        /* Ensure claps and responses icons/text are visible */
        .pw-multi-vote-count button, .mv path, .ax path, .mv {
          color: #eeeeee !important;
          fill: #eeeeee !important;
        }
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
