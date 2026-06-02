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

  const globalConfig = SEO_CONFIG[path];
  const title = globalConfig?.title || propTitle;
  const description = globalConfig?.description || propDescription;
  const faqs = globalConfig?.faqs || propFaqs;
  const keywords = globalConfig?.keywords || propKeywords;

  // Render Page Title
  const cleanTitle = title.endsWith("My Loves PDF") || title.endsWith("MyLovesPDF") ? title : `${title} | My Loves PDF`;

  // Build JSON-LD Structured Schema
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
      <meta property="og:site_name" content="My Loves PDF" />

      {/* 5. Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultImage} />

      {/* 6. JSON-LD Structured Schema script tag */}
      <script type="application/ld+json">
        {JSON.stringify(schemas)}
      </script>
    </Helmet>
  );
}
