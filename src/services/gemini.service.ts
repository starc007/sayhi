import { GoogleGenerativeAI } from "@google/generative-ai";
import { Gender } from "../utils/types";

export class GeminiService {
  private static genAI: GoogleGenerativeAI | null = null;

  public static async initialize(apiKey: string): Promise<boolean> {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      return true;
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
      return false;
    }
  }

  public static async generateConversationStarters(
    profile: string,
    tweets: string[],
    style: string,
    gender: Gender
  ): Promise<string[]> {
    if (!this.genAI) {
      throw new Error("Gemini API not initialized");
    }

    const stylePrompts: Record<string, Record<Gender, string>> = {
      casual: {
        male: "Write like you're texting a guy friend. Super chill and fun - the way guys chat!",
        female:
          "Write like you're texting a girl friend. Super chill and fun - the way girls chat!",
      },
      flirty: {
        male: "Keep it playful and fun like trending reels. Think modern and casual flirting!",
        female:
          "Keep it playful and fun like trending reels. Think modern and casual flirting!",
      },
      witty: {
        male: "Be that funny friend with the best comebacks. Use trending memes and pop culture references.",
        female:
          "Be that funny friend with the best comebacks. Use trending memes and pop culture references.",
      },
      intellectual: {
        male: "Like those chill late-night dorm discussions. Keep it smart but totally informal.",
        female:
          "Like those chill late-night dorm discussions. Keep it smart but totally informal.",
      },
    };

    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Help write super casual DMs for Twitter/X - the way Gen Z chats online. Think Instagram vibes!

Profile:
${profile}

Recent tweets:
${tweets.join("\n")}

Style: ${stylePrompts[style][gender]}

Rules:
- Write exactly like Gen Z texts each other
- Keep it short and fun (max 2 lines)
- Be super casual (like texting your bestie)
- Use current internet slang and emojis
- Reference their stuff in a cool way
- Make it easy to reply to
- Keep it in simple, casual English
- NO formal language!

Write 3 different casual conversation starters (one per line):`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return text
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, ""))
        .slice(0, 3);
    } catch (error) {
      console.error("Gemini generation error:", error);
      throw error;
    }
  }
}
