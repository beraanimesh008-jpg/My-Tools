import { useEffect } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface SEOProps {
  title: string;
  description: string;
  path: string;
  faqs?: FaqItem[];
}

export default function SEO({ title, description, path, faqs = [] }: SEOProps) {
  const fullUrl = `https://mylovespdf.com${path}`;
  const defaultImage = 'https://mylovespdf.com/og-image.png'; // Fallback sharing asset

  useEffect(() => {
    // 1. Update Title tag
    document.title = `${title} | My Loves PDF`;

    // Helper to find, update, or create meta tags securely
    const updateOrCreateMeta = (selector: string, attrName: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Head Description
    updateOrCreateMeta('meta[name="description"]', 'name', 'description', description);

    // 3. Canonical Link tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // 4. Open Graph - Core Tags
    updateOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', `${title} | My Loves PDF`);
    updateOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', description);
    updateOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', fullUrl);
    updateOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', defaultImage);
    updateOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    updateOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'My Loves PDF');

    // 5. Twitter Card - Core Tags
    updateOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', `${title} | My Loves PDF`);
    updateOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', defaultImage);

    // 6. JSON-LD Structured Data Schema Insertion (Organization, WebSite, FAQPage)
    // Clear old JSON-LD script if it exists to avoid memory-leak/duplicate indices on SPA transitions
    const oldScript = document.getElementById('seo-jsonld-schema');
    if (oldScript) {
      oldScript.remove();
    }

    const schemas: any[] = [
      // WebSite Schema
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
      // Organization Schema
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
      }
    ];

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

    // Embed combined script
    const script = document.createElement('script');
    script.id = 'seo-jsonld-schema';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schemas);
    document.head.appendChild(script);

    return () => {
      // Cleanup on component unmount
      const cleanupScript = document.getElementById('seo-jsonld-schema');
      if (cleanupScript) {
        cleanupScript.remove();
      }
    };
  }, [title, description, fullUrl, faqs]);

  // This is a headless metadata manager, so we render null
  return null;
}
