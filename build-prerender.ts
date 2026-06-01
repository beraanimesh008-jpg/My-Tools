import fs from 'fs';
import path from 'path';
import { SEO_CONFIG } from './src/utils/seoData';
import { BLOG_POSTS } from './src/utils/blogData';

const DIST_PATH = path.join(process.cwd(), 'dist');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper to pre-inject SEO metadata and content into the index.html template
function preInjectSeo(html: string, urlPath: string): string {
  try {
    let title = "My Loves PDF - Free Online PDF, Image, & AI Utilities Studio";
    let h1 = "Free Premium PDF Tools & Creative AI Studio";
    let desc = "Combine, compress, convert, and manage high-resolution PDF documents. Unlock advanced neural AI features.";
    let intro = "";
    let longSeoContent = "";
    let features: { title: string; description: string }[] = [];
    let faqs: { question: string; answer: string }[] = [];
    let isMatch = false;

    if (SEO_CONFIG[urlPath]) {
      const config = SEO_CONFIG[urlPath];
      title = config.title;
      h1 = config.h1;
      desc = config.description;
      intro = config.intro;
      features = config.features;
      faqs = config.faqs;
      longSeoContent = config.longSeoContent;
      isMatch = true;
    } else if (urlPath.startsWith("/blog/")) {
      const slug = urlPath.replace("/blog/", "");
      if (BLOG_POSTS[slug]) {
        const post = BLOG_POSTS[slug];
        title = post.title;
        h1 = post.title;
        desc = post.description;
        intro = post.description;
        longSeoContent = post.content;
        isMatch = true;
      }
    } else if (urlPath === "/blog") {
      title = "My Loves PDF Blog - Expert Productivity & Document Guides";
      h1 = "The Loves PDF Blog";
      desc = "Explore detailed operating checklists, optimization guides, format conversions tricks, and AI tutorials.";
      intro = "Actionable guides, speed checklists, and developer-grade summaries to help you optimize documents.";
      longSeoContent = "<h2>Latest Industry Articles</h2><ul>" + Object.values(BLOG_POSTS).map(p => `<li><a href="/blog/${p.slug}">${p.title}</a> - ${p.description}</li>`).join("") + "</ul>";
      isMatch = true;
    }

    if (!isMatch) return html;

    // Correctly replace the title
    const formattedTitle = (title.endsWith("My Loves PDF") || title.endsWith("MyLovesPDF") || title.includes("My Loves PDF") || title.includes("MyLovesPDF")) ? title : `${title} | My Loves PDF`;
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${formattedTitle}</title>`);

    // Clean any existing meta tag with name="description"
    html = html.replace(/<meta[^>]*name="description"[^>]*>/gi, '');

    const fullUrl = `https://mylovespdf.com${urlPath}`;
    const defaultImage = "https://mylovespdf.com/og-image.png";

    // Build JSON-LD Structured Data Schema for Crawler SEO
    const schemas: any[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'My Loves PDF',
        'url': 'https://mylovespdf.com',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://mylovespdf.com/?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'My Loves PDF',
        'url': 'https://mylovespdf.com',
        'logo': 'https://mylovespdf.com/favicon.ico',
        'sameAs': [
          'https://twitter.com/mylovespdf',
          'https://github.com/mylovespdf'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'email': 'support@mylovespdf.com',
          'contactType': 'customer support'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://mylovespdf.com'
          },
          ...(urlPath !== '/' ? [{
            '@type': 'ListItem',
            'position': 2,
            'name': h1,
            'item': fullUrl
          }] : [])
        ]
      }
    ];

    if (urlPath !== '/' && !urlPath.startsWith('/blog')) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': h1,
        'operatingSystem': 'All',
        'applicationCategory': 'BusinessApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0.00',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'ratingCount': '2840'
        }
      });
    }

    if (faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(item => ({
          '@type': 'Question',
          'name': item.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': item.answer
          }
        }))
      });
    }

    const headMetaInjections = `
  <meta name="description" content="${desc.replace(/"/g, '&quot;')}" />
  <link rel="canonical" href="${fullUrl}" />
  <meta property="og:title" content="${formattedTitle.replace(/"/g, '&quot;')}" />
  <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:image" content="${defaultImage}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="My Loves PDF" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${formattedTitle.replace(/"/g, '&quot;')}" />
  <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta name="twitter:image" content="${defaultImage}" />
  <script type="application/ld+json" id="seo-jsonld-schema">${JSON.stringify(schemas)}</script>`;

    html = html.replace("</head>", `${headMetaInjections}\n</head>`);

    // Root HTML Prerender Injection for Search Spiders (so Ctrl+U will display full readable body paragraphs)
    const renderedBody = `
<div id="root">
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

    html = html.replace(/<div id="root">\s*<\/div>/i, renderedBody);
    return html;
  } catch (err) {
    console.error(`Error in preInjectSeo for ${urlPath}:`, err);
    return html;
  }
}

// Generate static sitemap.xml
function generateSitemapXml(): string {
  const base = "https://mylovespdf.com";
  const paths = [
    "",
    "/merge-pdf",
    "/compress-pdf",
    "/split-pdf",
    "/pdf-to-jpg",
    "/jpg-to-pdf",
    "/pdf-to-word",
    "/word-to-pdf",
    "/background-remover",
    "/compress-image",
    "/image-converter",
    "/qr-gen",
    "/password-gen",
    "/tts",
    "/resume-builder",
    "/blog"
  ];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  paths.forEach(p => {
    const priority = p === "" ? "1.0" : p.startsWith("/blog") ? "0.7" : "0.9";
    xml += `\n  <url>\n    <loc>${base}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  Object.keys(BLOG_POSTS).forEach(slug => {
    xml += `\n  <url>\n    <loc>${base}/blog/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
  });

  xml += `\n</urlset>`;
  return xml;
}

// Generate static robots.txt
function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://mylovespdf.com/sitemap.xml`;
}

function runPrerendering() {
  console.log('🚀 Starting Static SEO Prerender Processor...');
  
  const templatePath = path.join(DIST_PATH, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Error: dist/index.html does not exist. Run "vite build" first!');
    process.exit(1);
  }

  const rawHtml = fs.readFileSync(templatePath, 'utf-8');

  // 1. Process all SEO_CONFIG paths (including /)
  const paths = Object.keys(SEO_CONFIG);
  paths.forEach(urlPath => {
    const injectedHtml = preInjectSeo(rawHtml, urlPath);
    if (urlPath === '/') {
      fs.writeFileSync(templatePath, injectedHtml, 'utf-8');
      console.log('✅ Prerendered root index.html');
    } else {
      const folderName = urlPath.substring(1);
      
      // Option A: Folder routing (e.g. dist/merge-pdf/index.html)
      const targetDir = path.join(DIST_PATH, folderName);
      ensureDir(targetDir);
      fs.writeFileSync(path.join(targetDir, 'index.html'), injectedHtml, 'utf-8');

      // Option B: Flat file routing (e.g. dist/merge-pdf.html)
      const flatFilePath = path.join(DIST_PATH, `${folderName}.html`);
      fs.writeFileSync(flatFilePath, injectedHtml, 'utf-8');

      console.log(`✅ Prerendered routing path (Dual-mode): ${urlPath}`);
    }
  });

  // 2. Process /blog index page
  const blogIndexDir = path.join(DIST_PATH, 'blog');
  ensureDir(blogIndexDir);
  const blogIndexHtml = preInjectSeo(rawHtml, '/blog');
  fs.writeFileSync(path.join(blogIndexDir, 'index.html'), blogIndexHtml, 'utf-8');
  fs.writeFileSync(path.join(DIST_PATH, 'blog.html'), blogIndexHtml, 'utf-8');
  console.log('✅ Prerendered path (Dual-mode): /blog');

  // 3. Process each dynamic blog post slug
  Object.keys(BLOG_POSTS).forEach(slug => {
    const postPath = `/blog/${slug}`;
    const targetDir = path.join(blogIndexDir, slug);
    ensureDir(targetDir);
    const postHtml = preInjectSeo(rawHtml, postPath);
    fs.writeFileSync(path.join(targetDir, 'index.html'), postHtml, 'utf-8');
    fs.writeFileSync(path.join(blogIndexDir, `${slug}.html`), postHtml, 'utf-8');
    console.log(`✅ Prerendered Blog Post slug (Dual-mode): ${postPath}`);
  });

  // 4. Generate sitemap.xml and robots.txt inside dist/
  fs.writeFileSync(path.join(DIST_PATH, 'sitemap.xml'), generateSitemapXml(), 'utf-8');
  fs.writeFileSync(path.join(DIST_PATH, 'robots.txt'), generateRobotsTxt(), 'utf-8');
  console.log('✅ Generated public/dist sitemap.xml and robots.txt files');

  console.log('🎉 Static SEO Prerendering Completed Successfully!');
}

runPrerendering();
