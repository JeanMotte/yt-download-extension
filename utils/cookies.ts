import { browser } from 'wxt/browser';

export async function getYoutubeCookiesForYtdlp(): Promise<string> {
  return new Promise((resolve) => {
    browser.cookies.getAll({ domain: ".youtube.com" }, (cookies) => {
      let cookieString = "# Netscape HTTP Cookie File\n";
      cookies.forEach((cookie) => {
        const line = [
          cookie.domain,
          "TRUE", // includeSubdomains
          cookie.path,
          cookie.secure.toString().toUpperCase(),
          cookie.expirationDate ? Math.round(cookie.expirationDate) : "0",
          cookie.name,
          cookie.value,
        ].join("\t"); // Tab-separated
        cookieString += line + "\n";
      });
      resolve(cookieString);
    });
  });
}