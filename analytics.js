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
    const evt = link.dataset.analyticsEvent || "";
    const text = link.textContent.trim();

    // macOS .dmg — 같은 탭 다운로드: 비콘이 도착하도록 이동을 잠깐 지연
    const isMacDownload = evt === "download_click" || /\.dmg(?:$|[?#])/i.test(href);
    // Windows — Microsoft Store: 새 탭(target="_blank")으로 열리므로 이동을 가로채지 않음
    const isWinDownload = evt === "download_click_win" || /apps\.microsoft\.com|ms-windows-store:/i.test(href);
    const isGumroad = /gumroad\.com\/l\//i.test(href);

    if (isMacDownload) {
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
        platform: "macos",
        link_url: href,
        link_text: text,
        transport_type: "beacon",
        event_callback: navigate,
        event_timeout: 800
      });

      sendEvent("download_click", {
        platform: "macos",
        download_file: "CatApp.dmg",
        link_url: href
      });

      window.setTimeout(navigate, 900);
      return;
    }

    if (isWinDownload) {
      // 새 탭이 이동을 처리하므로 preventDefault 없이 비콘만 전송(transport_type:"beacon"으로 신뢰성 확보)
      sendEvent("download_click", {
        platform: "windows",
        store: "microsoft",
        link_url: href,
        link_text: text
      });
      return;
    }

    if (isGumroad) {
      sendEvent("gumroad_click", {
        link_url: href,
        link_text: text
      });
    }
  });
})();
