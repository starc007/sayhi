export interface TwitterProfile {
  username: string;
  bio: string;
  followersCount: string;
  followingCount: string;
}

export interface Tweet {
  id: string;
  text: string;
  timestamp: string;
  likes: string;
  retweets: string;
  comments: string;
  views: string;
}

export interface ApiConfig {
  provider: "claude" | "gemini";
  claudeApiKey?: string;
  geminiApiKey?: string;
}

export interface ConversationStarter {
  topic: string;
  suggestion: string;
  confidence: number;
  isLoading?: boolean;
}

export interface AiProvider {
  name: string;
  id: "claude" | "gemini";
  description: string;
}

export type ConversationStyle = {
  id: string;
  name: string;
  description: string;
};

export const CONVERSATION_STYLES: ConversationStyle[] = [
  {
    id: "casual",
    name: "Casual",
    description: "Friendly and laid-back approach",
  },
  {
    id: "flirty",
    name: "Flirty",
    description: "Playful and charming tone",
  },
  {
    id: "witty",
    name: "Witty",
    description: "Clever and slightly sarcastic",
  },
  {
    id: "intellectual",
    name: "Intellectual",
    description: "Thoughtful and engaging",
  },
];

export type Gender = "male" | "female";

export const GENDER_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
];
