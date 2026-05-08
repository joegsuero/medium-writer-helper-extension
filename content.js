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

function isStatsPage() {
  // Check if URL matches Medium stats page
  const url = window.location.href;
  return url.includes('medium.com/me/stats') && !url.includes('/me/stats/post/');
}

function isStoriesPage() {
  // Check if URL matches Medium stories page (published posts)
  const url = window.location.href;
  return url.includes('medium.com/me/stories') && url.includes('tab=posts-published');
}

function extractStoriesStats() {
  const stories = [];

  try {
    // Get all table rows
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach(row => {
      try {
        // Stats link (contains post ID)
        const statsLink = row.querySelector('td:first-child a[href*="/me/stats/post/"]');
        if (!statsLink) return;

        const href = statsLink.getAttribute('href') || '';
        const postIdMatch = href.match(/\/me\/stats\/post\/([^/?]+)/);
        const postId = postIdMatch ? postIdMatch[1] : '';

        // Title
        const titleEl = statsLink.querySelector('h2');
        const title = titleEl ? titleEl.innerText.trim() : '';

        // View story link (for post URL)
        const viewLinks = row.querySelectorAll('td:first-child a');
        let postUrl = '';
        viewLinks.forEach(link => {
          const linkHref = link.getAttribute('href') || '';
          if (linkHref.includes('/@') || linkHref.includes('/p/')) {
            postUrl = linkHref.startsWith('http') ? linkHref : `https://medium.com${linkHref}`;
          }
        });

        // Fallback: construct URL from post ID
        if (!postUrl && postId) {
          postUrl = `https://medium.com/p/${postId}`;
        }

        // Stats columns
        const presentationsEl = row.querySelector('td:nth-child(2) span');
        const viewsEl = row.querySelector('td:nth-child(3) span');
        const readsEl = row.querySelector('td:nth-child(4) span');

        const presentations = parseNumber(presentationsEl ? presentationsEl.innerText : '0');
        const views = parseNumber(viewsEl ? viewsEl.innerText : '0');
        const reads = parseNumber(readsEl ? readsEl.innerText : '0');

        // Parse additional info from row text
        const rowText = row.innerText || '';
        const publishedDate = parseDateFromText(rowText);
        const readTime = parseReadTime(rowText);

        if (postId) {
          stories.push({
            title,
            postId,
            postUrl,
            presentations,
            views,
            reads,
            publishedDate,
            readTime
          });
        }
      } catch (e) {
        console.error('Error extracting row:', e);
      }
    });
  } catch (e) {
    console.error('Error extracting stats:', e);
  }

  return stories;
}

function parseNumber(text) {
  if (!text) return 0;
  text = text.trim().replace(/,/g, '');

  const multipliers = { 'K': 1000, 'M': 1000000 };
  const match = text.match(/^([\d.]+)([KM])?$/i);

  if (match) {
    const num = parseFloat(match[1]);
    const mult = multipliers[match[2]?.toUpperCase()] || 1;
    return Math.round(num * mult);
  }

  const num = parseInt(text, 10);
  return isNaN(num) ? 0 : num;
}

function parseDateFromText(text) {
  if (!text) return '';

  // Match patterns like "Jan 15", "Mar 3, 2024", "Dec 25, 2023"
  const dateMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,\s+(\d{4}))?/i);
  if (dateMatch) {
    const month = dateMatch[1];
    const day = dateMatch[2];
    const year = dateMatch[3] || new Date().getFullYear();
    return `${month} ${day}, ${year}`;
  }
  return '';
}

function parseReadTime(text) {
  if (!text) return '';

  const readMatch = text.match(/(\d+)\s*min\s*read/);
  if (readMatch) {
    return `${readMatch[1]} min`;
  }
  return '';
}

function extractStoriesData() {
  const stories = [];
  const extractedIds = new Set(); // Track extracted IDs to avoid duplicates
  const processedRows = new Set(); // Track processed row elements to avoid duplicates

  try {
    // Get all table rows with post data - try multiple strategies
    // Strategy 1: Look for rows with specific Medium story row classes
    let allStoryRows = [];
    const classRows = document.querySelectorAll('table tbody tr.le, table tbody tr[class*="zn"]');
    console.log(`Strategy 1 - Found ${classRows.length} story rows with class pattern`);
    classRows.forEach(row => {
      if (!processedRows.has(row)) {
        allStoryRows.push(row);
        processedRows.add(row);
      }
    });

    // Strategy 2: Find all rows and filter those containing Medium post links
    const allRows = document.querySelectorAll('table tbody tr');
    console.log(`Strategy 2 - Found ${allRows.length} total table rows`);

    // Filter rows that contain links with 12-char hex ID pattern
    // This captures both /@username/... and /publication/... URLs
    allRows.forEach(row => {
      if (processedRows.has(row)) return; // Skip already processed

      const allLinks = row.querySelectorAll('a[href]');
      let hasPostLink = false;
      let debugUrls = [];

      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        debugUrls.push(href.substring(0, 60));
        // Match any URL ending with -12hexchars (Medium post pattern)
        if (href.match(/-([a-f0-9]{12})(?:\?|$|\/)/)) {
          hasPostLink = true;
          break;
        }
      }

      if (hasPostLink) {
        allStoryRows.push(row);
        processedRows.add(row);
      } else if (allLinks.length > 0) {
        // Debug: Log URLs that didn't match
        console.log(`Row skipped - URLs found:`, debugUrls.slice(0, 3));
      }
    });
    console.log(`Strategy 2 - Total unique rows with post links: ${allStoryRows.length}`);

    // Strategy 3: Find any links on the page with post pattern that might not be in table rows
    const allPageLinks = document.querySelectorAll('a[href*="-"][href*="?source=your_stories_outbox"]');
    console.log(`Strategy 3 - Found ${allPageLinks.length} story outbox links`);

    let rows = allStoryRows;

    rows.forEach((row, index) => {
      try {
        // Try to find post ID from any link in the row
        let postId = '';
        let postLink = null;
        const allLinks = row.querySelectorAll('a[href]');

        for (const link of allLinks) {
          const href = link.getAttribute('href') || '';
          // Match pattern: /@username/title-id or /@username/title-id?query
          // ID is 12 hex chars at the end of the slug
          const idMatch = href.match(/-([a-f0-9]{12})(?:\?|$|\/)/);
          if (idMatch && idMatch[1]) {
            postId = idMatch[1];
            postLink = link;
            break;
          }
        }

        if (!postId) {
          console.log(`Row ${index}: No post ID found`);
          return;
        }

        // Skip if already extracted (avoid duplicates from multiple links)
        if (extractedIds.has(postId)) {
          return;
        }
        extractedIds.add(postId);

        // Get claps - look for SVG with aria-labelledby containing "clap" followed by a <p> with number
        let claps = 0;
        const allParagraphs = row.querySelectorAll('p');
        for (const p of allParagraphs) {
          const prevSvg = p.previousElementSibling;
          if (prevSvg && prevSvg.tagName === 'svg') {
            const ariaLabel = prevSvg.getAttribute('aria-labelledby') || '';
            const descEl = prevSvg.querySelector('desc');
            const descText = descEl ? descEl.textContent : '';

            if (ariaLabel.includes('clap') || descText.includes('clap')) {
              const num = parseInt(p.textContent?.trim() || '0', 10);
              if (!isNaN(num)) {
                claps = num;
                break;
              }
            }
          }
        }

        // Get comments - look for SVG with aria-labelledby containing "response" followed by a <p> with number
        let comments = 0;
        for (const p of allParagraphs) {
          const prevSvg = p.previousElementSibling;
          if (prevSvg && prevSvg.tagName === 'svg') {
            const ariaLabel = prevSvg.getAttribute('aria-labelledby') || '';
            const descEl = prevSvg.querySelector('desc');
            const descText = descEl ? descEl.textContent : '';

            if (ariaLabel.includes('response') || descText.includes('response')) {
              const num = parseInt(p.textContent?.trim() || '0', 10);
              if (!isNaN(num)) {
                comments = num;
                break;
              }
            }
          }
        }

        // Get image URL - look for medium images in the row
        const imgEl = row.querySelector('img[src*="miro.medium.com"]');
        const imageUrl = imgEl ? imgEl.getAttribute('src') : '';

        // Get publication - specifically check the "Publication" column (usually 2nd td, index 1)
        let publication = '';
        const cells = row.querySelectorAll('td');

        // The Publication column is typically index 1 (after the title column)
        // Check if there's a specific publication link or text in that cell
        if (cells.length > 1) {
          const pubCell = cells[1]; // Publication column

          // Look for publication link first
          const pubLink = pubCell.querySelector('a[href*="/publication/"], a[href*="/pub/"]');
          if (pubLink) {
            publication = pubLink.textContent?.trim() || '';
          } else {
            // Get all text content but exclude button/menu elements
            // Clone the cell to manipulate without affecting DOM
            const cellClone = pubCell.cloneNode(true);
            // Remove button elements and their children from clone
            const buttons = cellClone.querySelectorAll('button, svg, .speechify-ignore');
            buttons.forEach(el => el.remove());

            const cleanText = cellClone.textContent?.trim() || '';
            // Only use if it's a reasonable publication name (not empty, not too long, not generic text)
            if (cleanText &&
                cleanText.length > 0 &&
                cleanText.length < 100 &&
                !cleanText.match(/^(Published|Draft|Scheduled|Toggle|\d+)$/i) &&
                !cleanText.includes('actions menu')) {
              publication = cleanText;
            }
          }
        }

        stories.push({
          postId,
          claps,
          comments,
          imageUrl,
          publication
        });

        console.log(`Extracted: ${postId} - claps:${claps} comments:${comments} pub:"${publication}"`);
      } catch (e) {
        console.error(`Error extracting row ${index}:`, e);
      }
    });

    console.log(`Total stories extracted: ${stories.length}`);

    // Warn if extraction seems incomplete
    if (allStoryRows.length > stories.length) {
      console.warn(`Warning: Found ${allStoryRows.length} rows but only extracted ${stories.length} stories. Some rows may not have valid post IDs.`);
    }

    // Check for potential pagination (Medium loads more posts as you scroll)
    // Count only links that have actual post IDs (12 hex chars pattern)
    const allPostLinks = document.querySelectorAll('a[href*="?source=your_stories_outbox"]');
    let validPostLinks = 0;
    const seenPostIds = new Set();

    allPostLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const idMatch = href.match(/-([a-f0-9]{12})(?:\?|$|\/)/);
      if (idMatch && idMatch[1]) {
        const postId = idMatch[1];
        // Only count each unique post ID once (not both image and title links)
        if (!seenPostIds.has(postId)) {
          seenPostIds.add(postId);
          validPostLinks++;
        }
      }
    });

    // Warn only if there's a significant mismatch (more than 3 posts difference)
    if (validPostLinks > stories.length + 3) {
      console.warn(
        `%c⚠️ INCOMPLETE EXTRACTION: Found ${validPostLinks} posts in page but only extracted ${stories.length}.\n` +
        `%c👉 SOLUTION: Scroll down on the Stories page to load more posts, then click Download again.`,
        'color: #f59e0b; font-weight: bold; font-size: 14px;',
        'color: #10b981; font-weight: bold;'
      );
    } else if (validPostLinks === stories.length) {
      console.log(`✅ All ${stories.length} posts extracted successfully!`);
    }
  } catch (e) {
    console.error('Error extracting stories data:', e);
  }

  return stories;
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

        /* Post Preview Article Titles - Remove Background/Extra Highlight */
        article[data-testid="post-preview"] h2,
        article[data-testid="post-preview"] .ha.cn,
        .as.hc.ju.jv.jw.jx.jy.jz.ka.kb.kc.kd.ke.kf.kg.kh.ki.kj.kk.kl.km.kn.ko.kp.kq.kr.ks.kt.ku.kv.kw.kx.ky.kz.la.lb.lc.ld.le.lf.lg.lh.li.lj.lk.ll.lm {
          background: black !important;
          background-color: transparent !important;
          box-shadow: none !important;
          border: none !important;
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
      isEditor: !!(document.querySelector('.editable') || document.querySelector('[contenteditable="true"]') || window.location.href.includes('edit')),
      isStatsPage: isStatsPage(),
      isStoriesPage: isStoriesPage()
    });
  } else if (message.action === "extractStats") {
    const stats = extractStoriesStats();
    sendResponse({ stats });
  } else if (message.action === "extractStoriesData") {
    const stories = extractStoriesData();
    sendResponse({ stories });
  }
  return true; // Keep channel open for async response
});
