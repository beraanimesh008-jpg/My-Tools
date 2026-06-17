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

    // Inject crawler check script in head to instantly hide pre-rendered content from humans before body paint (except for compress-pdf and merge-pdf which are fully visible and standard)
    const crawlerCheckScript = (urlPath === "/compress-pdf" || urlPath === "/merge-pdf") ? "" : `
  <script id="seo-crawler-check">
    (function() {
      try {
        var ua = navigator.userAgent || "";
        var isBot = /googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|facebot|facebookexternalhit|twitterbot|linkedinbot|embedly|applebot|pinterest|slackbot|discordbot|telegrambot|whatsapp|screaming frog|semrushbot|ahrefsbot|mj12bot|bot|crawler|spider/i.test(ua);
        if (!isBot) {
          var style = document.createElement("style");
          style.id = "seo-hide-style";
          style.innerHTML = "#prerendered-seo-content { display: none !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }";
          document.head.appendChild(style);

          // Proactively remove the pre-rendered SEO content as soon as DOM is ready so no remnant remains
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              var el = document.getElementById('prerendered-seo-content');
              if (el) el.remove();
            });
          } else {
            var el = document.getElementById('prerendered-seo-content');
            if (el) el.remove();
          }
        }
      } catch (e) {}
    })();
  </script>`;

    const compressPdfSchema = urlPath === "/compress-pdf" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Compress PDF Online Free",
    "url": "https://mylovespdf.com/compress-pdf",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Compress PDF Online Free. Reduce PDF size without losing quality.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can I compress PDF without losing quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our smart compression engine uses vector preserving technology to scale down embedded images and minify unused XML structures. Unlike basic compression websites that convert PDF pages into raster image snapshots, our engine preserves original vector fonts and lines so text remains crystal clear and printable."
        }
      },
      {
        "@type": "Question",
        "name": "Is this PDF compressor free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, 100% free! You can compress as many files as you like without daily limits, subscription popups, or registered accounts."
        }
      },
      {
        "@type": "Question",
        "name": "Are uploaded files secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. All compression and decryption happen entirely within your local browser's memory sandbox. Your document payloads never touch a remote server, ensuring perfect confidential peace of mind."
        }
      },
      {
        "@type": "Question",
        "name": "What is the maximum PDF size?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our system is optimized to process large PDF files (up to 500MB) smoothly in real-time. Speed depends on your local computer's processor since work is completed safe and secure client-side."
        }
      },
      {
        "@type": "Question",
        "name": "Does this tool work on mobile devices?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we designed the interface to be mobile-first and fully responsive. You can select, configure and download optimized files on any iPhone, iPad or Android device with absolute ease."
        }
      }
    ]
  }
  </script>` : "";

    const mergePdfSchema = urlPath === "/merge-pdf" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Merge PDF Online Free",
    "url": "https://mylovespdf.com/merge-pdf",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Merge PDF Online Free. Merge multiple PDF files into a single document online for free. Fast, secure and easy PDF merger with no installation required.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I combine multiple PDF files into one for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply upload your PDF files by clicking the upload button or dragging them into our active dropzone. You can visually rearrange pages or documents in your preferred sequence, then click the 'Merge PDF' button. Your merged PDF will compile instantly and download automatically."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a limit on how many PDF files I can merge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, My Loves PDF allows you to combine and merge any number of PDF files completely free, with no file count limits or hidden subscription gates."
        }
      },
      {
        "@type": "Question",
        "name": "Is my personal data secure with My Loves PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, absolute safety and data confidentiality are guaranteed. All PDF file merging is executed in your secure local web browser context, and files are purged immediately after processing. We never store, inspect, or retain your contents."
        }
      }
    ]
  }
  </script>` : "";

    const headMetaInjections = `
  <title data-prerendered="true">${cleanTitle}</title>
  <meta data-prerendered="true" name="google-adsense-account" content="ca-pub-4026443598393506" />
  <meta data-prerendered="true" name="description" content="${desc.replace(/"/g, '&quot;')}" />
  <link data-prerendered="true" rel="canonical" href="${fullUrl}" />
  <meta data-prerendered="true" property="og:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-prerendered="true" property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-prerendered="true" property="og:url" content="${fullUrl}" />
  <meta data-prerendered="true" property="og:image" content="${defaultImage}" />
  <meta data-prerendered="true" property="og:type" content="website" />
  <meta data-prerendered="true" property="og:site_name" content="My Loves PDF" />
  <meta data-prerendered="true" name="twitter:card" content="summary_large_image" />
  <meta data-prerendered="true" name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-prerendered="true" name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-prerendered="true" name="twitter:image" content="${defaultImage}" />${crawlerCheckScript}${compressPdfSchema}${mergePdfSchema}`;

    html = html.replace(/<\/head>/i, `${headMetaInjections}\n</head>`);

    // Fully visible standard SEO content section
    const visibleBody = `
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
</div>`;

    // Root Prerender Injection (outside of root div) for search crawler spiders
    const renderedBody = `
<div id="prerendered-seo-content" style="display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; position: absolute !important; left: -9999px !important; top: -9999px !important; width: 0px !important; height: 0px !important; overflow: hidden !important; z-index: -9999 !important;">
  ${visibleBody}
</div>`;

    // Ensure we clean out any prior preloaded blocks first if any pre-rendered template is received
    html = html.replace(/<!--PRERENDER_START-->[\s\S]*?<!--PRERENDER_END-->/g, "");

    if (urlPath === "/compress-pdf" || urlPath === "/merge-pdf") {
      // Injected inside <div id="root"> completely visible, standard, normal for all visitors & crawlers alike!
      html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">\n${visibleBody}\n</div>`);
    } else {
      if (isBotRequest) {
        // Keep root pristine and append SEO content securely wrapped in clear comments
        html = html.replace(/<div id="root">\s*<\/div>/i, '<div id="root"></div>\n<!--PRERENDER_START-->' + renderedBody + '<!--PRERENDER_END-->');
      } else {
        // Guarantee <div id="root"></div> is perfectly clean and has absolutely no additional HTML injection for humans
        html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>');
      }
    }
    return html;
  } catch (err) {
    console.warn("preInjectSeo fallback trigger:", err);
    return html;
  }
};
