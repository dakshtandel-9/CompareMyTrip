import Script from "next/script";

const GTM_PATTERN = /^GTM-[A-Z0-9]+$/i;
const GA_PATTERN = /^G-[A-Z0-9]+$/i;

/** Optional Google Analytics 4 and Google Tag Manager loaders; no tracking
    ships without a real ID. Set only one of them for GA4: a GTM container that
    also carries a GA4 tag would count every page view twice. */
export default function Analytics() {
  const containerId = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
  const gtm = GTM_PATTERN.test(containerId);
  const ga = GA_PATTERN.test(measurementId);
  if (!gtm && !ga) return null;

  return (
    <>
      {/* Client-side route changes are counted by GA4's enhanced measurement
          ("page changes based on browser history events", on by default). */}
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`}
          </Script>
        </>
      )}
      {gtm && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`}
              height="0"
              width="0"
              className="hidden"
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}
    </>
  );
}
