import { Product, StoreSettings } from '../types';
import { BELGA_LOGO_URL } from './branding';

export interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
  productData?: {
    name: string;
    price: number;
    description: string;
    sku?: string;
    category?: string;
    inStock?: boolean;
    image: string;
  };
}

/**
 * Safely updates or creates a meta tag in the document head
 */
function setMetaTag(attributeName: string, attributeValue: string, content: string): void {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Safely updates the canonical link tag
 */
function setCanonical(url: string): void {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Updates Schema.org JSON-LD structured data script
 */
function setJsonLd(data: object): void {
  const scriptId = 'belga-schema-jsonld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Dynamic SEO Updater
 * Updates document.title, description, OpenGraph (og:title, og:description, og:image, og:url),
 * Twitter Cards, and Schema.org JSON-LD structured data.
 */
export function updateSEO(config: SEOConfig): void {
  const fullTitle = config.title.includes('Belga Móveis')
    ? config.title
    : `${config.title} | Belga Móveis`;

  const metaDesc = config.description.length > 160
    ? `${config.description.slice(0, 157)}...`
    : config.description;

  const currentUrl = config.url || (typeof window !== 'undefined' ? window.location.href : '/');
  const imageUrl = config.image || BELGA_LOGO_URL;

  // 1. Standard Document Title & Description
  document.title = fullTitle;
  setMetaTag('name', 'description', metaDesc);

  // 2. OpenGraph Meta Tags
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', metaDesc);
  setMetaTag('property', 'og:image', imageUrl);
  setMetaTag('property', 'og:url', currentUrl);
  setMetaTag('property', 'og:type', config.type || 'website');
  setMetaTag('property', 'og:site_name', 'Belga Móveis');

  // 3. Twitter Card Meta Tags
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', metaDesc);
  setMetaTag('name', 'twitter:image', imageUrl);
  setMetaTag('name', 'twitter:card', 'summary_large_image');

  // 4. Canonical Link
  setCanonical(currentUrl);

  // 5. Schema.org JSON-LD Structured Data
  if (config.productData) {
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: config.productData.name,
      image: config.productData.image,
      description: config.productData.description,
      sku: config.productData.sku || `BELGA-${Date.now().toString().slice(-4)}`,
      brand: {
        '@type': 'Brand',
        name: 'Belga Móveis',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: config.productData.price.toFixed(2),
        itemCondition: 'https://schema.org/NewCondition',
        availability: config.productData.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Belga Móveis',
        },
      },
    });
  } else {
    // Default Organization / FurnitureStore schema
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'FurnitureStore',
      name: 'Belga Móveis',
      image: BELGA_LOGO_URL,
      description: metaDesc,
      telephone: '+5521973934438',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Rio de Janeiro',
        addressRegion: 'RJ',
        addressCountry: 'BR',
      },
    });
  }
}

/**
 * Updates SEO specifically for a Product view
 */
export function updateSEOForProduct(product: Product): void {
  const primaryImage = product.images?.[0] || BELGA_LOGO_URL;
  const priceFormatted = `R$ ${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const installmentsFormatted = `${product.maxInstallments}x no crediário próprio`;

  updateSEO({
    title: `${product.name} - ${priceFormatted} em até ${installmentsFormatted}`,
    description: `${product.description} Compre agora na Belga Móveis por ${priceFormatted} ou em até ${installmentsFormatted} sem burocracia.`,
    image: primaryImage,
    type: 'product',
    productData: {
      name: product.name,
      price: product.price,
      description: product.description,
      sku: product.sku,
      category: product.categoryName || product.categoryId,
      inStock: product.stock > 0,
      image: primaryImage,
    },
  });
}

/**
 * Updates SEO for site sections / views
 */
export function updateSEOForSection(section: string, settings?: StoreSettings): void {
  const slogan = settings?.slogan || 'Seu lar mais completo!';

  switch (section) {
    case 'catalog':
      updateSEO({
        title: 'Catálogo de Móveis e Colchões Queen | Belga Móveis',
        description: 'Explore nossa linha completa de Colchões Queen molas ensacadas, sofás, camas box e móveis com crediário próprio facilitado.',
        image: BELGA_LOGO_URL,
      });
      break;

    case 'simulator':
      updateSEO({
        title: 'Simulador de Crediário Próprio em até 12x | Belga Móveis',
        description: 'Calcule as parcelas semanais, quinzenais ou mensais do seu carnê digital Belga Móveis. Rápido, transparente e sem burocracia.',
        image: BELGA_LOGO_URL,
      });
      break;

    case 'portal':
      updateSEO({
        title: 'Área do Cliente e Acompanhamento de Parcelas | Belga Móveis',
        description: 'Consulte suas parcelas do crediário, status dos seus pedidos, envie comprovantes Pix e converse com nossa equipe.',
        image: BELGA_LOGO_URL,
      });
      break;

    case 'admin':
      updateSEO({
        title: 'Painel Administrativo e Gestão Financeira | Belga Móveis',
        description: 'Área restrita de gestão de pedidos, fichas de crediário, PDV balcão e produtos da Belga Móveis.',
        image: BELGA_LOGO_URL,
      });
      break;

    case 'home':
    default:
      updateSEO({
        title: `Belga Móveis - ${slogan} • Crediário Digital e Colchões Queen`,
        description: 'Loja oficial da Belga Móveis no Rio de Janeiro. Colchões Queen com molas ensacadas, móveis para sala e quarto no carnê ou Pix.',
        image: BELGA_LOGO_URL,
      });
      break;
  }
}
