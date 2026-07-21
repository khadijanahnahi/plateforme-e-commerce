import { useEffect } from "react";

export default function useDocumentMeta({ canonical, description, image, jsonLd, title }) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;
    const managed = [];
    function meta(attribute, key, content) {
      if (!content) return;
      const element = document.createElement("meta");
      element.setAttribute(attribute, key); element.setAttribute("content", content); element.dataset.shopsphereMeta = "true";
      document.head.appendChild(element); managed.push(element);
    }
    meta("name", "description", description);
    meta("property", "og:title", title);
    meta("property", "og:description", description);
    meta("property", "og:image", image);
    meta("property", "og:type", jsonLd ? "article" : "website");
    let canonicalLink;
    if (canonical) { canonicalLink = document.createElement("link"); canonicalLink.rel = "canonical"; canonicalLink.href = canonical; canonicalLink.dataset.shopsphereMeta = "true"; document.head.appendChild(canonicalLink); }
    let script;
    if (jsonLd) { script = document.createElement("script"); script.type = "application/ld+json"; script.textContent = JSON.stringify(jsonLd); script.dataset.shopsphereMeta = "true"; document.head.appendChild(script); }
    return () => { document.title = previousTitle; managed.forEach((element) => element.remove()); canonicalLink?.remove(); script?.remove(); };
  }, [canonical, description, image, jsonLd, title]);
}
