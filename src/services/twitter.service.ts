import { TwitterProfile, Tweet } from "../utils/types";

export class TwitterService {
  private static readonly TWEETS_TO_FETCH = 20;

  public static async getProfile(username: string): Promise<TwitterProfile> {
    try {
      // Send message to content script to get profile data
      const response = await chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => {
          if (!tab.id) throw new Error("No tab ID found");
          return chrome.tabs.sendMessage(tab.id, {
            type: "GET_PROFILE_DATA",
            username,
          });
        });

      return response as TwitterProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return {
        username: username,
        bio: "Could not fetch profile data",
        followersCount: "0",
        followingCount: "0",
      };
    }
  }

  public static async getRecentTweets(username: string): Promise<Tweet[]> {
    try {
      // Send message to content script to get tweets
      const response = await chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => {
          if (!tab.id) throw new Error("No tab ID found");
          return chrome.tabs.sendMessage(tab.id, {
            type: "GET_TWEETS",
            username,
            count: this.TWEETS_TO_FETCH,
          });
        });

      return response as Tweet[];
    } catch (error) {
      console.error("Error fetching tweets:", error);
      return [];
    }
  }
}
