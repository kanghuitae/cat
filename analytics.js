/*
 * Google Analytics 4 — 고양이 키우기 (kanghuitae.github.io/cat)
 * 측정 ID: G-D8Z7333YJF   ·   index / notes / privacy 전 페이지에서 로드됨
 *
 * ── 이벤트 정리 ──────────────────────────────────────────────
 *  page_view       자동 (gtag config) — 전 페이지
 *  app_download    앱 다운로드 클릭 — 양 플랫폼 공통 단일 이벤트   ★두 다운로드 핵심 지표
 *                    platform : "macos" | "windows"
 *                    method   : "dmg"   | "ms_store"
 *                    link_url
 *  file_download   GA4 표준 파일 다운로드 — macOS .dmg 전용 (GA 기본 다운로드 리포트용)
 *                    file_name:"CatApp.dmg", file_extension:"dmg", platform:"macos"
 *  gumroad_click   입양권(Gumroad) 링크 클릭     { link_url, link_text }
 *  outbound_click  외부 사이트 링크 클릭(인스타/스레드 등)  { link_domain, link_url, link_text }
 *                  내부 링크(notes/privacy/#앵커)는 추적하지 않음.
 *
 * ── 맥 vs 윈도우 다운로드 비교 (★중요) ───────────────────────
 *  반드시 event_name = app_download + 측정기준 platform(macos/windows) 으로만 비교한다.
 *  ⚠ macOS 클릭은 file_download + app_download 2개가 함께 발사되므로,
 *    '이벤트 총수'로 맥/윈도우를 비교하면 macOS 가 2배로 부풀려 보인다 — 그 방식은 금지.
 *  · platform / method 를 표준 리포트에서 분할하려면 GA4 관리 → 맞춤 정의 →
 *    맞춤 측정기준(이벤트 범위)에 각각 등록(1회). 탐색/실시간/DebugView 는 등록 없이도 값이 보임.
 * ─────────────────────────────────────────────────────────────
 */
(() => {
  "use strict";

  const GA_MEASUREMENT_ID = "G-D8Z7333YJF";
  const isConfigured = /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-REPLACE_ME";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  if (!isConfigured) {
    console.warn("[analytics] analytics.js 의 GA_MEASUREMENT_ID 를 설정하면 Google Analytics 가 켜집니다.");
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

  // 맞춤 이벤트는 beacon 으로 전송 — 탭 전환/언로드에도 신뢰성 있게 도착
  const track = (name, params = {}) => {
    window.gtag("event", name, { transport_type: "beacon", ...params });
  };

  const onActivate = (event) => {
    // 좌클릭(0) + 가운데클릭(1=새 탭)만 처리. 우클릭(2) 등은 무시.
    // click 은 좌클릭, auxclick 은 가운데/보조클릭만 발생 → 동일 클릭이 중복 처리되지 않음.
    if (event.button !== 0 && event.button !== 1) return;

    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.href;                         // 절대 URL
    const hint = link.dataset.analyticsEvent || ""; // 선택적 명시 힌트
    const text = (link.textContent || "").trim().slice(0, 100);

    // 플랫폼 판별: href 가 1차 근거, data 힌트가 2차 보조
    const isMac = /\.dmg(?:$|[?#])/i.test(href) || hint === "download_click";
    const isWin = /apps\.microsoft\.com|ms-windows-store:/i.test(href) || hint === "download_click_win";
    const isGumroad = /gumroad\.com\/l\//i.test(href);

    if (isMac) {
      // GA4 표준 file_download (.dmg). 페이지 언로드 없이 다운로드되므로 가로채지 않음.
      // link_text 는 정적 라벨뿐이라 생략 — platform/method 로 지표가 완결됨(PII 표면 최소화).
      window.gtag("event", "file_download", {
        file_name: "CatApp.dmg",
        file_extension: "dmg",
        platform: "macos",
        link_url: href,
        transport_type: "beacon"
      });
      track("app_download", { platform: "macos", method: "dmg", link_url: href });
      return;
    }

    if (isWin) {
      // Microsoft Store — target="_blank" 새 탭 그대로 두고 이벤트만 기록
      track("app_download", { platform: "windows", method: "ms_store", link_url: href });
      return;
    }

    if (isGumroad) {
      track("gumroad_click", { link_url: href, link_text: text });
      return;
    }

    // 그 외 외부 사이트 링크(인스타/스레드 등). 내부 링크·앵커·mailto 는 제외.
    if (link.hostname && link.hostname !== window.location.hostname && /^https?:$/.test(link.protocol)) {
      track("outbound_click", { link_domain: link.hostname, link_url: href, link_text: text });
    }
  };

  document.addEventListener("click", onActivate);
  document.addEventListener("auxclick", onActivate); // 가운데클릭(새 탭)도 포착
})();
