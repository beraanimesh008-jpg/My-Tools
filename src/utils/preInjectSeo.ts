import { SEO_CONFIG } from "./seoData";
import { BLOG_POSTS } from "./blogData";

export const isBot = (userAgent: string | undefined | null): boolean => {
  if (!userAgent) return false;
  const botRegex = /googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebot|facebookexternalhit|twitterbot|linkedinbot|embedly|applebot|pinterest|slackbot|discordbot|telegrambot|whatsapp|screaming frog|semrushbot|ahrefsbot|mj12bot|bot|crawler|spider/i;
  return botRegex.test(userAgent);
};

export const preInjectSeo = (html: string, pathOrReq: any): string => {
  try {
    let urlPath = typeof pathOrReq === "string" ? pathOrReq : (pathOrReq?.path || "/");
    
    // Normalize trailing slash
    if (urlPath !== "/" && urlPath.endsWith("/")) {
      urlPath = urlPath.slice(0, -1);
    }

    let isBotRequest = false;
    let userAgent = "";
    if (typeof pathOrReq === "string") {
      isBotRequest = true; // Treating static build-prerendering as bot request to generate search engine indexing content
    } else if (pathOrReq && typeof pathOrReq === "object") {
      userAgent = pathOrReq.headers?.["user-agent"] || "";
      isBotRequest = isBot(userAgent);
      console.log(`SEO Crawler Check: Path="${urlPath}", UA="${userAgent}" -> isBot: ${isBotRequest}`);
    }

    let title = "My Loves PDF - Free Online PDF, Image, & AI Utilities Studio";
    let h1 = "Free Premium PDF Tools & Creative AI Studio";
    let desc = "Combine, compress, convert, and manage high-resolution PDF documents. Unlock advanced neural AI features.";
    let intro = "";
    let longSeoContent = "";
    let features: { title: string; description: string }[] = [];
    let faqs: { question: string; answer: string }[] = [];

    if (SEO_CONFIG[urlPath]) {
      const config = SEO_CONFIG[urlPath];
      title = config.title;
      h1 = config.h1;
      desc = config.description;
      intro = config.intro;
      features = config.features;
      faqs = config.faqs;
      longSeoContent = config.longSeoContent;
    } else if (urlPath.startsWith("/blog/")) {
      const slug = urlPath.replace("/blog/", "");
      if (BLOG_POSTS[slug]) {
        const post = BLOG_POSTS[slug];
        title = post.title;
        h1 = post.title;
        desc = post.description;
        intro = post.description;
        longSeoContent = post.content;
      }
    } else if (urlPath === "/blog") {
      title = "My Loves PDF Blog - Expert Productivity & Document Guides";
      h1 = "The Loves PDF Blog";
      desc = "Explore detailed operating checklists, optimization guides, format conversions tricks, and AI tutorials.";
      intro = "Actionable guides, speed checklists, and developer-grade summaries to help you optimize documents.";
      longSeoContent = "<h2>Latest Industry Articles</h2><ul>" + Object.values(BLOG_POSTS).map(p => `<li><a href="/blog/${p.slug}">${p.title}</a> - ${p.description}</li>`).join("") + "</ul>";
    }

    const req = typeof pathOrReq === "string" ? { path: pathOrReq } : pathOrReq;
    console.log("SEO Route Injection:", req.path);
    console.log("SEO Inject Title:", title);

    // Header Meta replacement
    const cleanTitle = (title.includes("My Loves PDF") || title.includes("MyLovesPDF")) ? title : `${title} | My Loves PDF`;
    
    // Clean up any stray old title or meta description tags if present to guarantee strictly exactly one in the static markup
    html = html.replace(/<title[^>]*>[^<]*<\/title>/gi, "");
    html = html.replace(/<meta\s+[^>]*name="description"[^>]*\/?>/gi, "");

    const fullUrl = `https://mylovespdf.com${urlPath}`;
    const defaultImage = "https://mylovespdf.com/og-image.png";

    // Inject crawler check script in head to instantly hide pre-rendered content from humans before body paint
    const crawlerCheckScript = `
  <script id="seo-crawler-check">
    (function() {
      try {
        var ua = navigator.userAgent || "";
        var isBot = /googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebot|facebookexternalhit|twitterbot|linkedinbot|embedly|applebot|pinterest|slackbot|discordbot|telegrambot|whatsapp|screaming frog|semrushbot|ahrefsbot|mj12bot|bot|crawler|spider/i.test(ua);
        if (!isBot) {
          var style = document.createElement("style");
          style.id = "seo-hide-style";
          style.innerHTML = "#prerendered-seo-content { display: none !important; }";
          document.head.appendChild(style);
        }
      } catch (e) {}
    })();
  </script>`;

    const headMetaInjections = `
  <title data-rh="true">${cleanTitle}</title>
  <meta data-rh="true" name="description" content="${desc.replace(/"/g, '&quot;')}" />
  <link data-rh="true" rel="canonical" href="${fullUrl}" />
  <meta data-rh="true" property="og:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" property="og:url" content="${fullUrl}" />
  <meta data-rh="true" property="og:image" content="${defaultImage}" />
  <meta data-rh="true" property="og:type" content="website" />
  <meta data-rh="true" property="og:site_name" content="My Loves PDF" />
  <meta data-rh="true" name="twitter:card" content="summary_large_image" />
  <meta data-rh="true" name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-rh="true" name="twitter:image" content="${defaultImage}" />${crawlerCheckScript}`;

    html = html.replace(/<\/head>/i, `${headMetaInjections}\n</head>`);

    // Root Prerender Injection (outside of root div) for search crawler spiders
    const renderedBody = `
<div id="prerendered-seo-content">
  <div style="padding: 40px 20px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
    <h1 style="font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.025em;">${h1}</h1>
    <p style="font-size: 1.125rem; color: #475569; margin-bottom: 30px;">${intro}</p>
    
    ${features.length > 0 ? `
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 40px; margin-bottom: 15px;">Key Features</h2>
      <ul style="margin-bottom: 30px; padding-left: 20px;">
        ${features.map(f => `<li><strong>${f.title}</strong>: ${f.description}</li>`).join("")}
      </ul>
    ` : ""}

    ${longSeoContent}

    ${faqs.length > 0 ? `
      <h2 style="font-size: 1.75rem; font-weight: 700; color: #0f172a; margin-top: 50px; margin-bottom: 20px;">Frequently Asked Questions</h2>
      <div>
        ${faqs.map(faq => `
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${faq.question}</h3>
            <p style="color: #475569; font-size: 0.950rem;">${faq.answer}</p>
          </div>
        `).join("")}
      </div>
    ` : ""}
  </div>
</div>`;

    // Ensure we clean out any prior preloaded blocks first if any pre-rendered template is received
    html = html.replace(/<!--PRERENDER_START-->[\s\S]*?<!--PRERENDER_END-->/g, "");

    if (isBotRequest) {
      // Keep root pristine and append SEO content securely wrapped in clear comments
      html = html.replace(/<div id="root">\s*<\/div>/i, '<div id="root"></div>\n<!--PRERENDER_START-->' + renderedBody + '<!--PRERENDER_END-->');
    } else {
      // Guarantee <div id="root"></div> is perfectly clean and has absolutely no additional HTML injection for humans
      html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>');
    }
    return html;
  } catch (err) {
    console.warn("preInjectSeo fallback trigger:", err);
    return html;
  }
};
