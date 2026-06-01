import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  keywords?: string;
}

const SEO = ({
  title,
  description = "Hire vetted African operations professionals and remote experts. Opsly HR connects global teams with top-tier product and operations talent across EMEA.",
  canonical = "https://opslyhr.com",
  ogImage = "https://opslyhr.com/og-image.png",
  ogType = "website",
  keywords = "African Operations Professionals, Remote Hiring, Vetted Talent, EMEA Operations, Product Management Africa, Remote Work EMEA"
}: SEOProps) => {
  const siteTitle = "Opsly HR | Remote Operations Experts";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* OpenGraph / Facebook */}
      <meta property="og:site_name" content="Opsly HR" />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Best Practices */}
      <meta name="application-name" content="Opsly HR" />
      <meta name="apple-mobile-web-app-title" content="Opsly HR" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#0f2147" />
    </Helmet>
  );
};

export default SEO;
