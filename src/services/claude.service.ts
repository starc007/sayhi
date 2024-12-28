import { ApiConfig, Gender } from "../utils/types";
import Anthropic from "@anthropic-ai/sdk";

export class ClaudeService {
  private static anthropic: Anthropic | null = null;

  public static async initialize(): Promise<boolean> {
    const config = await this.getApiConfig();
    if (config?.claudeApiKey) {
      this.anthropic = new Anthropic({
        apiKey: config.claudeApiKey,
        dangerouslyAllowBrowser: true,
      });
      return true;
    }
    return false;
  }

  public static async generateConversationStarters(
    profile: string,
    tweets: string[],
    style: string,
    gender: Gender
  ): Promise<string[]> {
    if (!this.anthropic) {
      throw new Error("Claude API not initialized");
    }

    const stylePrompts: Record<string, Record<Gender, string>> = {
      casual: {
        male: "Write like you're texting a guy friend. Super chill and fun - the way guys chat!",
        female:
          "Write like you're texting a girl friend. Super chill and fun - the way girls chat!",
      },
      flirty: {
        male: "Keep it playful and fun like trending reels. Think modern guy flirting casually!",
        female:
          "Keep it playful and fun like trending reels. Think modern girl flirting casually!",
      },
      witty: {
        male: "Be that funny guy friend with the best comebacks. Use trending memes and pop culture references.",
        female:
          "Be that funny girl friend with the best comebacks. Use trending memes and pop culture references.",
      },
      intellectual: {
        male: "Like those chill late-night dorm discussions with guys. Keep it smart but totally informal.",
        female:
          "Like those chill late-night dorm discussions with girls. Keep it smart but totally informal.",
      },
    };

    const prompt = `Help write super casual DMs for Twitter/X - the way Gen Z ${
      gender === "male" ? "guys" : "girls"
    } chat online. Think Instagram vibes!

Profile Info:
${profile}

Recent Activity:
${tweets.join("\n")}

Style: ${stylePrompts[style][gender]}

Rules:
- Write exactly like Gen Z ${
      gender === "male" ? "guys" : "girls"
    } text each other
- Keep it short and fun (max 2 lines)
- Be super casual (like texting your bestie)
- Use current internet slang and emojis
- Reference their stuff in a cool way
- Make it easy to reply to
- Keep it in simple, casual English
- NO formal language!

Give me 3 different casual conversation starters:`;

    const response = (await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    })) as any;

    // Extract and process the responses
    const text = response.content[0].text as string;
    return text
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("-"))
      .map((line) => line.replace(/^\d+\.\s*/, ""))
      .slice(0, 3);
  }

  public static async getApiConfig(): Promise<ApiConfig | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["aiConfig"], (result) => {
        resolve(result.aiConfig || null);
      });
    });
  }

  public static async saveApiConfig(config: ApiConfig): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ aiConfig: config }, resolve);
    });
  }
}
