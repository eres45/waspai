export type TempMailProvider =
  | "mail.tm"
  | "1secmail"
  | "guerrillamail"
  | "maildrop.cc";

export interface TempMailMessage {
  id: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  date: string;
}

export interface TempMailAccount {
  email: string;
  provider: TempMailProvider;
  password?: string; // Only for mail.tm
  token?: string; // Only for mail.tm
}

export class TempMailService {
  private static readonly USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  /**
   * Mail.tm (Default)
   */
  static async createMailTmAccount(): Promise<TempMailAccount> {
    const domainRes = await fetch("https://api.mail.tm/domains", {
      headers: { "User-Agent": this.USER_AGENT },
    });
    const domainData = await domainRes.json();
    const domain = domainData["hydra:member"]?.[0]?.domain || "mail.tm";

    const username = Math.random().toString(36).substring(2, 10);
    const password = Math.random().toString(36).substring(2, 15);
    const address = `${username}@${domain}`;

    const createRes = await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": this.USER_AGENT,
      },
      body: JSON.stringify({ address, password }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json();
      throw new Error(
        `Mail.tm error: ${errorData.message || createRes.statusText}`,
      );
    }

    // Get token immediately
    const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": this.USER_AGENT,
      },
      body: JSON.stringify({ address, password }),
    });
    const tokenData = await tokenRes.json();

    return {
      email: address,
      provider: "mail.tm",
      password,
      token: tokenData.token,
    };
  }

  static async getMailTmMessages(
    account: TempMailAccount,
  ): Promise<TempMailMessage[]> {
    let token = account.token;

    // Refresh token if missing but we have password
    if (!token && account.password) {
      const tokenRes = await fetch("https://api.mail.tm/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": this.USER_AGENT,
        },
        body: JSON.stringify({
          address: account.email,
          password: account.password,
        }),
      });
      const tokenData = await tokenRes.json();
      token = tokenData.token;
    }

    if (!token) throw new Error("Authentication token required for Mail.tm");

    const res = await fetch("https://api.mail.tm/messages", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": this.USER_AGENT,
      },
    });
    const data = await res.json();
    const messages = data["hydra:member"] || [];

    // Fetch details for each message (Mail.tm list is summary only)
    return Promise.all(
      messages.map(async (m: any) => {
        const detailRes = await fetch(`https://api.mail.tm/messages/${m.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": this.USER_AGENT,
          },
        });
        const detail = await detailRes.json();
        return {
          id: m.id,
          from: m.from.address,
          subject: m.subject,
          text: detail.text || "No content",
          html: detail.html?.[0] || "",
          date: m.createdAt,
        };
      }),
    );
  }

  /**
   * 1SecMail
   */
  static async create1SecMailAccount(): Promise<TempMailAccount> {
    const res = await fetch(
      "https://www.1secmail.com/api/v1/?action=genRandomMailbox",
      {
        headers: { "User-Agent": this.USER_AGENT },
      },
    );
    const data = await res.json();
    return {
      email: data[0],
      provider: "1secmail",
    };
  }

  static async get1SecMailMessages(email: string): Promise<TempMailMessage[]> {
    const [login, domain] = email.split("@");
    const res = await fetch(
      `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`,
      {
        headers: { "User-Agent": this.USER_AGENT },
      },
    );
    const data = await res.json();

    return Promise.all(
      data.map(async (m: any) => {
        const detailRes = await fetch(
          `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${m.id}`,
          {
            headers: { "User-Agent": this.USER_AGENT },
          },
        );
        const detail = await detailRes.json();
        return {
          id: String(m.id),
          from: m.from,
          subject: m.subject,
          text: detail.textBody || detail.body || "",
          html: detail.htmlBody,
          date: m.date,
        };
      }),
    );
  }

  /**
   * Guerrilla Mail
   */
  static async createGuerrillaMailAccount(): Promise<TempMailAccount> {
    const res = await fetch(
      "https://api.guerrillamail.com/ajax.php?f=get_email_address&ip=127.0.0.1&agent=BetterChatbot",
      {
        headers: { "User-Agent": this.USER_AGENT },
      },
    );
    const data = await res.json();
    return {
      email: data.email_addr,
      provider: "guerrillamail",
      token: data.sid_token, // Store SID token as "token"
    };
  }

  static async getGuerrillaMailMessages(
    sid: string,
  ): Promise<TempMailMessage[]> {
    const res = await fetch(
      `https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&sid_token=${sid}`,
      {
        headers: { "User-Agent": this.USER_AGENT },
      },
    );
    const data = await res.json();
    const list = data.list || [];

    return Promise.all(
      list.map(async (m: any) => {
        const detailRes = await fetch(
          `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${m.mail_id}&sid_token=${sid}`,
          {
            headers: { "User-Agent": this.USER_AGENT },
          },
        );
        const detail = await detailRes.json();
        return {
          id: m.mail_id,
          from: m.mail_from,
          subject: m.mail_subject,
          text: detail.mail_body || "",
          date: new Date(parseInt(m.mail_timestamp) * 1000).toISOString(),
        };
      }),
    );
  }

  /**
   * Maildrop.cc
   */
  static async getMaildropMessages(
    mailbox: string,
  ): Promise<TempMailMessage[]> {
    const name = mailbox.split("@")[0];
    const query = `query { inbox(mailbox: "${name}") { id subject mailfrom date body } }`;
    const res = await fetch("https://api.maildrop.cc/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": this.USER_AGENT,
      },
      body: JSON.stringify({ query }),
    });
    const { data } = await res.json();
    const messages = data?.inbox || [];

    return messages.map((m: any) => ({
      id: m.id,
      from: m.mailfrom,
      subject: m.subject,
      text: m.body || "No content",
      date: m.date,
    }));
  }
}
