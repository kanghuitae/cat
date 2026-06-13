(() => {
  const GA_MEASUREMENT_ID = "G-D8Z7333YJF";
  const isConfigured = /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-REPLACE_ME";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  if (!isConfigured) {
    console.warn("[analytics] Set GA_MEASUREMENT_ID in analytics.js to enable Google Analytics.");
    return;
  }

  const gtagScript = document.createElement("script");
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(gtagScript);

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href
  });

  const sendEvent = (name, parameters = {}) => {
    window.gtag("event", name, {
      transport_type: "beacon",
      ...parameters
    });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.href;
    const isDownload = link.dataset.analyticsEvent === "download_click" || /\.dmg(?:$|[?#])/i.test(href);
    const isGumroad = /gumroad\.com\/l\//i.test(href);

    if (isDownload) {
      event.preventDefault();

      let navigated = false;
      const navigate = () => {
        if (navigated) return;
        navigated = true;
        window.location.href = href;
      };

      window.gtag("event", "file_download", {
        file_extension: "dmg",
        file_name: "CatApp.dmg",
        link_url: href,
        link_text: link.textContent.trim(),
        transport_type: "beacon",
        event_callback: navigate,
        event_timeout: 800
      });

      sendEvent("download_click", {
        download_file: "CatApp.dmg",
        link_url: href
      });

      window.setTimeout(navigate, 900);
      return;
    }

    if (isGumroad) {
      sendEvent("gumroad_click", {
        link_url: href,
        link_text: link.textContent.trim()
      });
    }
  });
})();
