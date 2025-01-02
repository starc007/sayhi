import React, { useEffect, useState } from "react";
import {
  TwitterProfile,
  Tweet,
  ConversationStarter,
  CONVERSATION_STYLES,
  Gender,
  GENDER_OPTIONS,
} from "../../utils/types";
import { TwitterService } from "../../services/twitter.service";
import { ClaudeService } from "../../services/claude.service";
import { GeminiService } from "../../services/gemini.service";
import ApiKeyInput from "../ApiKeyInput/ApiKeyInput";
import BottomSheet from "../BottomSheet/BottomSheet";
import AiSelector from "../AiSelector/AiSelector";

function Popup() {
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [suggestions, setSuggestions] = useState<ConversationStarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [hasAnyKey, setHasAnyKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [selectedStyle, setSelectedStyle] = useState<string>("casual");
  const [selectedGender, setSelectedGender] = useState<Gender>("female");

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current Twitter profile from the active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tab.url?.includes("x.com")) {
          const username = extractUsernameFromUrl(tab.url);
          if (username) {
            const profileData = await TwitterService.getProfile(username);
            const tweetsData = await TwitterService.getRecentTweets(username);

            setProfile(profileData);
            setTweets(tweetsData);
          }
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const checkApiConfig = async () => {
      const config = await chrome.storage.local.get(["aiConfig"]);
      const hasKey = !!(
        config.aiConfig?.claudeApiKey || config.aiConfig?.geminiApiKey
      );
      setHasAnyKey(hasKey);
      if (hasKey) {
        const isInitialized =
          config.aiConfig?.provider === "gemini"
            ? await GeminiService.initialize(config.aiConfig.geminiApiKey!)
            : await ClaudeService.initialize();
        setIsApiConfigured(isInitialized);
      }
    };
    checkApiConfig();
  }, []);

  const extractUsernameFromUrl = (url: string): string | null => {
    const match = url.match(/x\.com\/([^/]+)/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const generateSuggestions = async () => {
    if (!profile || !tweets.length) return;

    setIsGenerating(true);
    try {
      const profileData = `Username: ${profile.username}\nBio: ${profile.bio}\nFollowers: ${profile.followersCount}\nFollowing: ${profile.followingCount}`;
      const tweetTexts = tweets.map((t) => t.text);

      const suggestions =
        selectedProvider === "gemini"
          ? await GeminiService.generateConversationStarters(
              profileData,
              tweetTexts,
              selectedStyle,
              selectedGender
            )
          : await ClaudeService.generateConversationStarters(
              profileData,
              tweetTexts,
              selectedStyle,
              selectedGender
            );

      setSuggestions(
        suggestions.map((text, i) => ({
          topic: `Suggestion ${i + 1}`,
          suggestion: text,
          confidence: 1,
        }))
      );
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApiKeySet = async () => {
    setIsApiConfigured(true);
    setIsBottomSheetOpen(false);
    setHasAnyKey(true);

    // Re-check API configuration
    const config = await chrome.storage.local.get(["aiConfig"]);
    if (config.aiConfig?.provider === "gemini") {
      await GeminiService.initialize(config.aiConfig.geminiApiKey!);
    } else {
      await ClaudeService.initialize();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!hasAnyKey) {
    return <ApiKeyInput onApiKeySet={handleApiKeySet} />;
  }

  return (
    <div className="w-[400px] h-[400px] relative">
      <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
        {profile ? (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-lg font-bold">@{profile.username}</h2>
              <p className="text-sm text-gray-600">{profile.bio}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value as Gender)}
                  disabled={isGenerating}
                  className="px-1.5 py-1.5 rounded-lg text-sm bg-gray-100 border border-gray-200 focus:outline-none focus:border-black"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={isGenerating}
                  className="flex-1 px-1.5 py-1.5 rounded-lg text-sm bg-gray-100 border border-gray-200 focus:outline-none focus:border-black"
                >
                  {CONVERSATION_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
                <AiSelector
                  selectedProvider={selectedProvider}
                  onSelect={setSelectedProvider}
                  disabled={isGenerating}
                />
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {tweets.length} tweets analyzed
              </div>
              <button
                onClick={generateSuggestions}
                disabled={isGenerating}
                className="w-full bg-black text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate Suggestions"}
              </button>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm text-gray-600">
                      {suggestion.topic}
                    </p>
                    <button
                      onClick={() => handleCopy(suggestion.suggestion)}
                      className="text-gray-500 hover:text-black"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm">{suggestion.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            Please navigate to a Twitter profile
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-white border-t">
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-full py-1.5 text-xs text-gray-600 hover:text-black"
        >
          Configure AI Settings
        </button>
      </div>

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <ApiKeyInput onApiKeySet={handleApiKeySet} />
      </BottomSheet>
    </div>
  );
}

export default Popup;
