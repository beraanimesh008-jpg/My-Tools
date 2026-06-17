import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG } from '../utils/seoData';

interface FaqItem {
  question: string;
  answer: string;
}

interface SEOProps {
  title: string;
  description: string;
  path: string;
  faqs?: FaqItem[];
  keywords?: string;
}

export default function SEO({ title: propTitle, description: propDescription, path, faqs: propFaqs = [], keywords: propKeywords }: SEOProps) {
  const fullUrl = `https://mylovespdf.com${path}`;
  const defaultImage = 'https://mylovespdf.com/og-image.png'; // Fallback sharing asset

  let normalizedPath = path || "/";
  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Secure config lookup preventing homepage fallback SEO from loading on route pages
  const globalConfig = (path && normalizedPath !== "/") ? SEO_CONFIG[normalizedPath] : (path === "/" ? SEO_CONFIG["/"] : undefined);
  const title = globalConfig?.title || propTitle;
  const description = globalConfig?.description || propDescription;
  const faqs = globalConfig?.faqs || propFaqs;
  const keywords = globalConfig?.keywords || propKeywords;

  // Render Page Title
  const hasBrand = title.toLowerCase().includes("my loves pdf") || title.toLowerCase().includes("mylovespdf");
  const cleanTitle = hasBrand ? title.replace(/My Loves PDF/g, "MyLovesPDF") : `${title} | MyLovesPDF`;

  console.log("SEO Component Eval:", { path, normalizedPath, cleanTitle });

  // Build JSON-LD Structured Schema
  const schemas: any[] = [
    // WebSite Schema
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'MyLovesPDF',
      'url': 'https://mylovespdf.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://mylovespdf.com/?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    },
    // Organization Schema
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'MyLovesPDF',
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
    // BreadcrumbList Schema
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
        ...(path !== '/' ? [{
          '@type': 'ListItem',
          'position': 2,
          'name': globalConfig?.h1 || title,
          'item': `https://mylovespdf.com${path}`
        }] : [])
      ]
    }
  ];

  // If we're on a tool page, add SoftwareApplication and WebApplication Schemas
  if (path !== '/') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': globalConfig?.h1 || title,
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

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': globalConfig?.h1 || title,
      'operatingSystem': 'All',
      'applicationCategory': 'BusinessApplication',
      'browserRequirements': 'Requires HTML5 and Javascript support',
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

  // If faqs exist, inject FAQPage Structured Schema to capture rich snippets on Google Search
  if (faqs && faqs.length > 0) {
    const faqSchema = {
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
    };
    schemas.push(faqSchema);
  }

  return (
    <Helmet>
      {/* 1. Page Title */}
      <title>{cleanTitle}</title>

      {/* Google AdSense Verification Tag */}
      <meta name="google-adsense-account" content="ca-pub-4026443598393506" />

      {/* 2. Core Meta Description */}
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* 3. Canonical Link Tag */}
      <link rel="canonical" href={fullUrl} />

      {/* 4. Open Graph Social Sharing Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="MyLovesPDF" />

      {/* 5. Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultImage} />

      {/* 6. JSON-LD Structured Schema script tag */}
      <script type="application/ld+json">
        {JSON.stringify(schemas)}
      </script>
      {normalizedPath === '/compress-pdf' && (
        <script type="application/ld+json">
          {`{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Compress PDF Online Free",
  "url": "https://mylovespdf.com/compress-pdf",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "description": "Compress PDF files online for free. Reduce PDF size without losing quality.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}`}
        </script>
      )}
      {normalizedPath === '/merge-pdf' && (
        <>
          <script type="application/ld+json">
            {`{
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
}`}
          </script>
          <script type="application/ld+json">
            {`{
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
}`}
          </script>
        </>
      )}
      {normalizedPath === '/split-pdf' && (
        <>
          <script type="application/ld+json">
            {`{
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
}`}
          </script>
          <script type="application/ld+json">
            {`{
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
}`}
          </script>
        </>
      )}
    {normalizedPath === '/jpg-to-pdf' && (
        <>
          <script type="application/ld+json">
            {`{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Convert JPG to PDF Online Free",
  "url": "https://mylovespdf.com/jpg-to-pdf",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}`}
          </script>
          <script type="application/ld+json">
            {`{
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
}`}
          </script>
        </>
      )}
      {normalizedPath === '/pdf-to-jpg' && (
        <>
          <script type="application/ld+json">
            {`{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Convert PDF to JPG Online Free",
  "url": "https://mylovespdf.com/pdf-to-jpg",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}`}
          </script>
          <script type="application/ld+json">
            {`{
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
}`}
          </script>
        </>
      )}
    </Helmet>
  );
}
