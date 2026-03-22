import * as cheerio from "cheerio";

export interface SMSMessage {
  from: string;
  text: string;
  date: string;
}

export interface SMSNumber {
  number: string;
  country: string;
  status: string;
  provider: "smss.net" | "smss.biz";
}

export class SMSService {
  private static readonly HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  private static getCountryCode(country: string): string {
    const map: Record<string, string> = {
      "united kingdom": "gb",
      uk: "gb",
      "united states": "us",
      us: "us",
      usa: "us",
      algeria: "dz",
      france: "fr",
      germany: "de",
      india: "in",
      russia: "ru",
    };
    return map[country.toLowerCase()] || country.toLowerCase().substring(0, 2);
  }

  private static getCountrySlug(country: string): string {
    const map: Record<string, string> = {
      usa: "united-states",
      us: "united-states",
      uk: "united-kingdom",
    };
    return (
      map[country.toLowerCase()] ||
      country.toLowerCase().trim().replace(/\s+/g, "-")
    );
  }

  /**
   * List available numbers for a given country
   */
  static async listNumbers(country?: string): Promise<SMSNumber[]> {
    const results: SMSNumber[] = [];
    const providers = [
      {
        name: "smss.net",
        url: country
          ? `https://smss.net/numbers/${this.getCountryCode(country)}`
          : "https://smss.net",
      },
      {
        name: "smss.biz",
        url: country
          ? `https://smss.biz/free-temporary-numbers/${this.getCountrySlug(country)}`
          : "https://smss.biz",
      },
    ];

    for (const p of providers) {
      try {
        const response = await fetch(p.url, { headers: this.HEADERS });
        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);

        // 1. JSON NextData Strategy
        try {
          const nextData = $("#__NEXT_DATA__").html();
          if (nextData) {
            const data = JSON.parse(nextData);
            // Dynamic exploration of the data object
            const findNumbers = (obj: any) => {
              if (!obj || typeof obj !== "object") return;
              if (
                obj.number &&
                typeof obj.number === "string" &&
                obj.number.length >= 10
              ) {
                results.push({
                  number: obj.number.startsWith("+")
                    ? obj.number
                    : `+${obj.number}`,
                  country: country || "International",
                  status: "Online",
                  provider: p.name as any,
                });
              }
              Object.values(obj).forEach(findNumbers);
            };
            findNumbers(data);
          }
        } catch (_e) {}

        // 2. Global Regex Strategy (Best for dynamic spans/divs)
        const numRegex = /\+?([1-9]\d{9,14})/g;
        let match;
        while ((match = numRegex.exec(html)) !== null) {
          const num = match[1];
          // Simple validation: ignore common static numbers/dates if any
          if (num.length >= 10 && !num.includes("2026")) {
            results.push({
              number: `+${num}`,
              country: country || "International",
              status: "Online",
              provider: p.name as any,
            });
          }
        }

        // 3. Link Strategy
        $("a[href*='/number/'], a[href*='/temporary-phone-number/']").each(
          (_, el) => {
            const href = $(el).attr("href") || "";
            const num = href.match(/\/(\d+)\/?$/)?.[1];
            if (num && num.length >= 10) {
              results.push({
                number: `+${num}`,
                country: country || "International",
                status: "Online",
                provider: p.name as any,
              });
            }
          },
        );
      } catch (_err) {}
    }

    // Filter results to match country prefix if possible
    const finalResults = Array.from(
      new Map(results.map((n) => [n.number, n])).values(),
    ).filter((n) => {
      if (!country) return true;
      const code = this.getCountryCode(country);
      if (code === "us") return n.number.startsWith("+1");
      if (code === "gb") return n.number.startsWith("+44");
      if (code === "fr") return n.number.startsWith("+33");
      if (code === "dz") return n.number.startsWith("+213");
      return true;
    });

    return finalResults.slice(0, 20);
  }

  /**
   * Get messages for a specific number
   */
  static async getMessages(
    number: string,
    provider: "smss.net" | "smss.biz" = "smss.net",
    country: string = "United Kingdom",
  ): Promise<SMSMessage[]> {
    const cleanNumber = number.replace(/\+/g, "");
    const slug = this.getCountrySlug(country);
    const url =
      provider === "smss.net"
        ? `https://smss.net/temporary-phone-number/${slug}/${cleanNumber}`
        : `https://smss.biz/free-temporary-numbers/${slug}/${cleanNumber}`;

    try {
      const response = await fetch(url, { headers: this.HEADERS });
      const html = await response.text();
      const $ = cheerio.load(html);
      const messages: SMSMessage[] = [];

      // Check for card-based messages (smss.net)
      $("div.bg-white, .message-box, div[class*='message']").each((_, el) => {
        const from = $(el).find("span, div, h4").first().text().trim();
        const text = $(el)
          .find("p, div.text-gray-700, .msg-content")
          .text()
          .trim();
        const date = $(el).find("span.text-xs, .time").text().trim();
        if (from && text && from !== "From" && from.length < 50)
          messages.push({ from, text, date });
      });

      // Check for table-based messages (smss.biz)
      if (messages.length === 0) {
        $("table tr").each((i, el) => {
          if (i === 0) return;
          const date = $(el).find("td:nth-child(1)").text().trim();
          const from = $(el).find("td:nth-child(2)").text().trim();
          const text = $(el).find("td:nth-child(3)").text().trim();
          if (from && text && from !== "SENDER")
            messages.push({ from, text, date });
        });
      }
      return messages;
    } catch (error: any) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }
}
