import { SEO_CONFIG } from "./seoData";
import { BLOG_POSTS } from "./blogData";

export const isBot = (userAgent: string | undefined | null): boolean => {
  if (!userAgent) return false;
  const botKeywords = [
    "googlebot",
    "bingbot",
    "yandexbot",
    "baiduspider",
    "facebookexternalhit",
    "twitterbot",
    "rogerbot",
    "linkedinbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "pinterest",
    "developers.google.com/+/web/snippet",
    "slackbot",
    "vkshare",
    "w3c_validator",
    "redditbot",
    "applebot",
    "whatsapp",
    "flipboard",
    "tumblr",
    "gsa-crawler",
    "google-keyword-association",
    "adsbot-google",
    "googlebot-image",
    "googlebot-news",
    "googlebot-video",
    "mediapartners-google",
    "apis-google",
    "chrome-lighthouse",
    "pagespeed",
    "lighthouse",
    "bot",
    "crawler",
    "spider",
    "slurp"
  ];
  const ua = userAgent.toLowerCase();
  return botKeywords.some(keyword => ua.includes(keyword));
};

export const preInjectSeo = (html: string, pathOrReq: any): string => {
  try {
    let urlPath = typeof pathOrReq === "string" ? pathOrReq : (pathOrReq?.path || "/");
    
    // Normalize trailing slash
    if (urlPath !== "/" && urlPath.endsWith("/")) {
      urlPath = urlPath.slice(0, -1);
    }

    let title = "MyLovesPDF - Free Online PDF, Image, & AI Utilities Studio";
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
      title = "MyLovesPDF Blog - Expert Productivity & Document Guides";
      h1 = "The Loves PDF Blog";
      desc = "Explore detailed operating checklists, optimization guides, format conversions tricks, and AI tutorials.";
      intro = "Actionable guides, speed checklists, and developer-grade summaries to help you optimize documents.";
      longSeoContent = "<h2>Latest Industry Articles</h2><ul>" + Object.values(BLOG_POSTS).map(p => `<li><a href="/blog/${p.slug}">${p.title}</a> - ${p.description}</li>`).join("") + "</ul>";
    }

    const req = typeof pathOrReq === "string" ? { path: pathOrReq } : pathOrReq;
    console.log("SEO Route Injection:", req.path);
    console.log("SEO Inject Title:", title);

    // Header Meta replacement
    const cleanTitle = (title.includes("My Loves PDF") || title.includes("MyLovesPDF")) ? title.replace(/My Loves PDF/g, "MyLovesPDF") : `${title} | MyLovesPDF`;
    
    // Clean up any stray old title or meta description tags if present to guarantee strictly exactly one in the static markup
    html = html.replace(/<title[^>]*>[^<]*<\/title>/gi, "");
    html = html.replace(/<meta\s+[^>]*name="description"[^>]*\/?>/gi, "");

    const fullUrl = `https://mylovespdf.com${urlPath}`;
    const defaultImage = "https://mylovespdf.com/og-image.png";

    // Inject crawler check script is completely removed as requested
    const crawlerCheckScript = "";

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
          "text": "No, MyLovesPDF allows you to combine and merge any number of PDF files completely free, with no file count limits or hidden subscription gates."
        }
      },
      {
        "@type": "Question",
        "name": "Is my personal data secure with MyLovesPDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, absolute safety and data confidentiality are guaranteed. All PDF file merging is executed in your secure local web browser context, and files are purged immediately after processing. We never store, inspect, or retain your contents."
        }
      }
    ]
  }
  </script>` : "";

    const splitPdfSchema = urlPath === "/split-pdf" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Split PDF Online Free",
    "url": "https://mylovespdf.com/split-pdf",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Split PDF Online Free. Extract specific pages from heavy PDF documents or split individual files into multiple smaller PDF records online for free.",
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
        "name": "How do I split specific page ranges from a PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Super simple! Upload your file, input your desired ranges (like '3-7, 12, 15'), and click split to compile those exact pages."
        }
      },
      {
        "@type": "Question",
        "name": "Can I split password-protected PDFs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, as long as you decrypt the file first. Once unlocked, you can split its pages without any restrictions."
        }
      },
      {
        "@type": "Question",
        "name": "Will my extracted PDFs lose original text formatting?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, our splits are non-destructive and preserve original text, layout structures, and formatting perfectly."
        }
      }
    ]
  }
  </script>` : "";

    const jpgToPdfSchema = urlPath === "/jpg-to-pdf" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Convert JPG to PDF Online Free",
    "url": "https://mylovespdf.com/jpg-to-pdf",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Convert JPG, JPEG and PNG images to PDF online for free. Fast, secure and high-quality JPG to PDF converter with no installation required.",
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
        "name": "How do I convert JPG images into a PDF online for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply upload your JPG, JPEG, or PNG images by dragging them into the dashboard. Customize your margin preferences and page layouts (A4, Letter, etc.), organize the image flow sequence, and click 'Convert to PDF' to enjoy your automatic download instantly."
        }
      },
      {
        "@type": "Question",
        "name": "Can I combine multiple list photos into a single PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MyLovesPDF is engineered to let you combine multiple JPG images into one cohesive PDF document easily. Reorder individual pages by dragging them visually before rendering."
        }
      },
      {
        "@type": "Question",
        "name": "Is there an image resolution loss during JPG to PDF conversion?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Our high-fidelity rendering pipeline maps original image pixel grids perfectly inside container document streams, preventing any loss of resolution or text fuzziness."
        }
      }
    ]
  }
  </script>` : "";

    const pdfToJpgSchema = urlPath === "/pdf-to-jpg" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Convert PDF to JPG Online Free",
    "url": "https://mylovespdf.com/pdf-to-jpg",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Convert PDF pages to JPG images online for free. Fast, secure and high-quality PDF to JPG converter with no installation required.",
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
        "name": "How do I convert PDF pages to JPG images online for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply upload your PDF document, select your preferred quality multiplier (80%, 90%, 100%), and let our high-speed tool extract every page into a crisp JPG. Download them as individual files or a aggregated ZIP file package safely."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a page count limit when extracting images from PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, MyLovesPDF provides uncompromised bulk extraction. You can convert short invoices or multi-hundred page ebooks completely free of charge and signup limitations."
        }
      },
      {
        "@type": "Question",
        "name": "Is my document data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely, privacy is guaranteed. All PDF to image rendering is mapped in your secure client environment, assuring no external leaks ever occur."
        }
      }
    ]
  }
  </script>` : "";
  
    const wordToPdfSchema = urlPath === "/word-to-pdf" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Convert Word to PDF Online Free",
    "url": "https://mylovespdf.com/word-to-pdf",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Convert Word to PDF online for free. Instantly turn DOC or DOCX documents to high-quality PDF in your browser. Fast, secure, and no sign-up required!",
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
        "name": "How do I convert a Word document to PDF online for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply upload your Word document (both DOCX and DOC legacy files are fully supported) to the MyLovesPDF conversion dropzone. Our high-fidelity browser rendering pipeline processes your layouts and compiles the document into a standardized, web-ready PDF instantly. Once processed, your secure download appears automatically."
        }
      },
      {
        "@type": "Question",
        "name": "Does converting DOCX to PDF preserve custom fonts, formatting, and margins?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MyLovesPDF is engineered to prevent any layout modifications or spacing changes during conversion. Our tool reads original document spacing properties, page breaks, table structures, and coordinates, mapping them precisely to standard vector coordinate systems so your PDF retains the identical layout aesthetics."
        }
      },
      {
        "@type": "Question",
        "name": "Are my private documents secure when using this online Word to PDF tool?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. At MyLovesPDF, your file privacy is our highest priority. Unlike other online converters that upload your documents to remote, insecure clouds, all processing occurs directly in your local browser sandbox via compiled WebAssembly. Your files are never sent over the network, ensuring complete safety and compliance."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a page number or file size limitation for conversions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, MyLovesPDF is an uncompromised, free utility designed for both light pages and heavy documents. You can compile multiple multi-hundred page ebooks, business filings, or educational homework papers up to 50MB per task without seeing paywalled credit constraints or daily limits."
        }
      },
      {
        "@type": "Question",
        "name": "Can I convert older binary Word .doc files, or only newer .docx formats?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer comprehensive support for both older binary DOC documents (Microsoft Word 97-2003 formats) and newer XML-based DOCX files. Our parser recognizes either extension and converts them to standard-compliant PDFs without lag."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to sign up, install external software, or pay for conversions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No registration forms, payment schemes, daily quotas, or software installations are required. MyLovesPDF is 100% free with clean, uncompromised AdSense-compliant layouts, letting you achieve professional document conversions instantly and safely."
        }
      },
      {
        "@type": "Question",
        "name": "Is the resulting PDF document fully compatible across Windows, Mac, and mobile?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, the converted output files conform exactly to universal ISO PDF specifications. Your document can be opened, viewed, and printed consistently on any operating system, including Windows, macOS, iOS, Android, and Linux, without layout drift."
        }
      },
      {
        "@type": "Question",
        "name": "Can I perform bulk Word to PDF document conversions on my phone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MyLovesPDF is optimized with a highly responsive, mobile-first design. You can select Word files directly from your mobile file explorer or cloud drive, run the conversion inside your phone browser, and download the resulting PDFs smoothly."
        }
      },
      {
        "@type": "Question",
        "name": "How does MyLovesPDF compare to traditional, cloud-based online tools?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Traditional web converters upload your confidential data to backend servers, creating serious privacy compromises and slower download speeds. MyLovesPDF runs heavy compilation packages locally within your web browser sandbox, delivering higher speeds and perfect file privacy."
        }
      },
      {
        "@type": "Question",
        "name": "How can I edit my converted PDF or merge it with other files?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Once converted, MyLovesPDF provides a complete ecosystem of tools to manage your documents. Cleanly edit your PDF layout back to Word using PDF to Word, combine multiple documents using Merge PDF, separate key sections with Split PDF, or optimize sharing sizes with Compress PDF."
        }
      }
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mylovespdf.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Word to PDF",
        "item": "https://mylovespdf.com/word-to-pdf"
      }
    ]
  }
  </script>` : "";
  
    const compressImageSchema = urlPath === "/compress-image" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI Image Compressor Online Free",
    "url": "https://mylovespdf.com/compress-image",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Compress JPG, PNG, and WEBP images online with our free AI Image Compressor. Reduce image size in seconds while preserving perfect visual quality. No sign-up!",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2840"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyLovesPDF",
    "url": "https://mylovespdf.com",
    "logo": "https://mylovespdf.com/favicon.ico",
    "sameAs": [
      "https://twitter.com/mylovespdf",
      "https://github.com/mylovespdf"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@mylovespdf.com",
      "contactType": "customer support"
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
        "name": "What is image compression and how does it work online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Image compression is the technical process of reducing an image's overall data footprint (file size in kilobytes or megabytes) without significantly altering its outer dimensions or visible visual aesthetics. Online image compressors analyze the underlying grid of pixels and apply advanced mathematical algorithms—either lossy or lossless—to strip redundant headers, compress color palettes, and merge visually non-discernible gradients to make files lightweight for web transport."
        }
      },
      {
        "@type": "Question",
        "name": "How does the AI Ultra Image Compressor reduce size without losing visual quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MyLovesPDF uses neural-modeled visual perception thresholds to compress images. Our compression engine analyzes structural detail arrays and prioritizes complex edges and focal points while reducing detail in homogeneous areas (like solid background skies). We also strip metadata structures (EXIF data, geolocation, camera details) to squeeze extra kilobytes out of each file while keeping details crisp."
        }
      },
      {
        "@type": "Question",
        "name": "Which formats does this free online image optimizer support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our tool supports a comprehensive ecosystem of image formats. You can easily compress legacy formats like JPEG and JPG, lossless transparent PNG graphics, and next-generation, Google-recommended WEBP files. The compiler processes your files in seconds, letting you keep the original extensions or convert between formats during output."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a limit on how many images I can compress daily?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely not. At MyLovesPDF, our core mission is delivering accessible, high-performance office utility suites to everyone. There are no daily conversion limits, hidden subscription requirements, email forms, or premium credit limits. You can process single files or bulk uploads of any volume up to 50MB per task completely free."
        }
      },
      {
        "@type": "Question",
        "name": "What is the difference between lossy and lossless image compression?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Lossy compression achieves maximum file size reduction (often up to 80-90%) by permanently stripping unimportant color data that the human eye cannot perceive. Lossless compression, on the other hand, compresses the file size while preserving 100% of the raw, original pixel data, meaning the decompressed image is mathematically identical to the source, which is perfect for transparent logos and vector grids."
        }
      },
      {
        "@type": "Question",
        "name": "How does shrinking images improve Google SEO rankings and Core Web Vitals?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Google's search algorithm prioritizes mobile loading speed as a prominent ranking factor. High-resolution uncompressed assets block browser threads, causing long Largest Contentful Paint (LCP) delays. Reducing image size decreases overall page body payloads, optimizing your server response time, improving bounce rates, and increasing your crawl budget so Google indexes more pages."
        }
      },
      {
        "@type": "Question",
        "name": "Are my private photos and graphics secure on MyLovesPDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, privacy is our highest engineering priority. MyLovesPDF utilizes secure local WebAssembly and browser Canvas structures. Your files are never uploaded to a remote file server or stored on external hard drives. This local sandbox execution ensures complete file confidentiality and total data protection, satisfying enterprise security guidelines."
        }
      },
      {
        "@type": "Question",
        "name": "Can I compress images directly on my mobile smartphone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MyLovesPDF is fully responsive and mobile-friendly. You can access our tool from Safari on iOS, Chrome on Android, or any modern mobile web browser. Simply upload photos directly from your phone's camera roll or local storage, run the local compilation, and download the optimized files back to your device."
        }
      },
      {
        "@type": "Question",
        "name": "How does transition to WEBP format compare with JPG and PNG compression?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WebP is a modern image format developed by Google that offers superior lossless and lossy compression for web images. WebP lossless images are up to 26% smaller than PNGs and lossy WebP images are up to 34% smaller than comparable JPEGs, while supporting full alpha channel transparency. Converting legacy files to WebP is highly recommended for optimal modern web performance."
        }
      },
      {
        "@type": "Question",
        "name": "How can I edit my converted PDF or merge it with other files?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Once converted, MyLovesPDF provides a complete ecosystem of tools to manage your documents. Cleanly edit your PDF layout back to Word using PDF to Word, combine multiple documents using Merge PDF, separate key sections with Split PDF, or optimize sharing sizes with Compress PDF."
        }
      }
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mylovespdf.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Compress Image",
        "item": "https://mylovespdf.com/compress-image"
      }
    ]
  }
  </script>` : "";

    const imageConverterSchema = urlPath === "/image-converter" ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Image Converter Online Free",
    "url": "https://mylovespdf.com/image-converter",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Any",
    "description": "Convert images online for free with MyLovesPDF. Our premium Lossless Image Converter turns PNG, JPG, and WEBP files secure and instant. Try bulk transfers!",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "3510"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MyLovesPDF",
    "url": "https://mylovespdf.com",
    "logo": "https://mylovespdf.com/favicon.ico",
    "sameAs": [
      "https://twitter.com/mylovespdf",
      "https://github.com/mylovespdf"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@mylovespdf.com",
      "contactType": "customer support"
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
        "name": "How do I convert an image format online for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply upload your graphics into our MyLovesPDF active dropzone. Choose your target formatting extension (JPG, PNG, or WEBP) and click the Convert button. Our local browser-side rendering queue transcodes your image and downloads your high-resolution result instantly."
        }
      },
      {
        "@type": "Question",
        "name": "Can I convert images without losing original pixel quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Our Lossless Image Converter is engineered to retain maximum color depth and details. When you convert using lossless formats (such as converting WebP to PNG), our tool performs mathematically perfect pixel mappings, ensuring the converted image looks exactly as designed."
        }
      },
      {
        "@type": "Question",
        "name": "Is this free online photo converter safe and private?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. Most online converters upload your personal photos and sensitive business invoices directly to external cloud servers, violating data security. MyLovesPDF works entirely client-side using advanced WebAssembly, meaning your files never leave your computer, providing complete privacy."
        }
      },
      {
        "@type": "Question",
        "name": "Which image formats does MyLovesPDF support for conversions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support a complete suite of standard modern and legacy image formats, including JPEG, JPG, PNG with alpha transparency, and next-generation WebP. Our toolkit processes files instantly, allowing you to convert freely between any of these formats."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a limit on file size or the number of conversions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, MyLovesPDF is a completely free utility with no daily quotas or subscription paywalls. You can convert single files or massive packages of images up to 50MB per task as many times as you need."
        }
      },
      {
        "@type": "Question",
        "name": "How does converting JPG to WEBP help increase website speed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "WebP is Google's recommended next-gen format that uses smart predictive encoding. Converting standard JPEGs to WebP reduces file size by up to 30% without visible quality loss, speeding up your web pages and improving Core Web Vitals."
        }
      },
      {
        "@type": "Question",
        "name": "How can I convert images directly on my Android or iPhone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MyLovesPDF is fully responsive and optimized for mobile screens. You can select graphics directly from your phone's photo library, convert them in safari or chrome, and download the finished assets directly back to your device."
        }
      },
      {
        "@type": "Question",
        "name": "Does MyLovesPDF support bulk image conversions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can upload multiple images simultaneously. Our tool processes the files in parallel inside your browser and packages them into a clean, easy-to-download ZIP file, saving you time."
        }
      },
      {
        "@type": "Question",
        "name": "Can I convert transparent PNG images to other formats?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can convert PNGs with transparency to WEBP (which fully supports transparency) or to JPG (which will paint the transparent background color with solid white, reducing the overall file size)."
        }
      },
      {
        "@type": "Question",
        "name": "How can I edit or compress my newly converted images?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MyLovesPDF offers a complete set of helper utilities. After converting your files, you can shrink file sizes further with our <a href=\"/compress-image\">Compress Image</a> tool, clear backgrounds with <a href=\"/background-remover\">Remove Background</a>, or compile them into standard PDFs with <a href=\"/jpg-to-pdf\">JPG to PDF</a>."
        }
      }
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mylovespdf.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Image Converter",
        "item": "https://mylovespdf.com/image-converter"
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
  <meta data-prerendered="true" property="og:site_name" content="MyLovesPDF" />
  <meta data-prerendered="true" name="twitter:card" content="summary_large_image" />
  <meta data-prerendered="true" name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
  <meta data-prerendered="true" name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
  <meta data-prerendered="true" name="twitter:image" content="${defaultImage}" />${crawlerCheckScript}${compressPdfSchema}${mergePdfSchema}${splitPdfSchema}${jpgToPdfSchema}${pdfToJpgSchema}${wordToPdfSchema}${compressImageSchema}${imageConverterSchema}`;

    html = html.replace(/<\/head>/i, `${headMetaInjections}\n</head>`);

    // Ensure we clean out any prior preloaded blocks first if any pre-rendered template is received
    html = html.replace(/<!--PRERENDER_START-->[\s\S]*?<!--PRERENDER_END-->/g, "");

    // Always return clean <div id="root"></div> for normal visitors and bots alike to let React render immediately without pre-render flash
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root"></div>`);
    
    return html;
  } catch (err) {
    console.warn("preInjectSeo fallback trigger:", err);
    return html;
  }
};
