const puppeteer = require("puppeteer");
const fs = require("fs"); // Fájlkezeléshez szükséges modul
const path = require("path");

// Kulcsszavak beolvasása fájlból
const keywordsFilePath = path.join(__dirname, "keywords.txt");
const searchKeywords = fs
  .readFileSync(keywordsFilePath, "utf8") // Fájl tartalmának beolvasása
  .split("\n") // Sorok feldarabolása
  .map((keyword) => keyword.trim()) // Sorok körüli whitespace eltávolítása
  .filter((keyword) => keyword.length > 0); // Üres sorok kiszűrése

async function scrapeFacebookAds() {
  // Indítsuk el a Puppeteer böngészőt
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  for (let keyword of searchKeywords) {
    console.log(keyword);

    const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=HU&is_targeted_country=false&media_type=all&q=${encodeURIComponent(
      keyword
    )}&search_type=keyword_unordered`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    const selector =
      "div.x8t9es0.x1uxerd5.xrohxju.x108nfp6.xq9mrsl.x1h4wwuj.x117nqv4.xeuugli";

    // Várjuk meg, hogy az oldal betöltődjön
    await page.waitForSelector(selector); // Módosítsd az elem osztályát, ha változott

    // Kinyerjük a találatok számát és a linket
    const result = await page.evaluate((selector) => {
      const resultsCountSelector = document.querySelector(selector);
      let resultsCount = resultsCountSelector?.textContent || "";
      resultsCount = resultsCount
        .replace("~", "")
        .replace("results", "")
        .trim(); // Eltávolítjuk a "~" és "results" szavakat
      const link = window.location.href;
      return { resultsCount, link };
    }, selector); // A selector változót itt adjuk át

    results.push({ keyword, ...result });
  }

  await browser.close();

  // Eredmények kiírása CSV fájlba
  const csvContent = results
    .map(
      ({ keyword, resultsCount, link }) =>
        `"${keyword}","${resultsCount}","${link}"`
    )
    .join("\n");

  const filePath = path.join(__dirname, "results.csv");
  fs.writeFileSync(
    filePath,
    `Keyword,Results Count,Link\n${csvContent}`,
    "utf8"
  );

  console.log(
    `Az eredmények kiírásra kerültek a következő fájlba: ${filePath}`
  );
}

scrapeFacebookAds().catch(console.error);
