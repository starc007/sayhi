import { TwitterProfile, Tweet } from "../utils/types";

class TwitterPageObserver {
  private static instance: TwitterPageObserver;
  private observer: MutationObserver;

  private constructor() {
    this.observer = new MutationObserver(this.handleDOMChanges.bind(this));
    this.setupMessageListener();
  }

  static getInstance(): TwitterPageObserver {
    if (!TwitterPageObserver.instance) {
      TwitterPageObserver.instance = new TwitterPageObserver();
    }
    return TwitterPageObserver.instance;
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case "GET_PROFILE_DATA":
          this.getProfileData().then(sendResponse);
          break;
        case "GET_TWEETS":
          this.getTweets(request.count).then(sendResponse);
          break;
      }
      return true; // Required to use sendResponse asynchronously
    });
  }

  private async getProfileData(): Promise<TwitterProfile> {
    try {
      // Wait for profile elements to be available
      await this.waitForElement('[data-testid="UserName"]');

      const username = this.extractUsername();
      const bio = this.extractBio();
      const { followersCount, followingCount } = this.extractFollowCounts();

      return {
        username,
        bio,
        followersCount,
        followingCount,
      };
    } catch (error) {
      console.error("Error extracting profile data:", error);
      throw error;
    }
  }

  private async getTweets(count: number): Promise<Tweet[]> {
    try {
      await this.waitForElement('[data-testid="tweet"]');

      const tweets: Tweet[] = [];
      const seenTweets = new Set<string>(); // Track unique tweets by text
      const tweetElements = document.querySelectorAll('[data-testid="tweet"]');

      for (let i = 0; i < tweetElements.length && tweets.length < count; i++) {
        const tweet = this.extractTweetData(tweetElements[i]);
        if (tweet && !seenTweets.has(tweet.text)) {
          seenTweets.add(tweet.text);
          tweets.push(tweet);
        }
      }

      return tweets;
    } catch (error) {
      console.error("Error extracting tweets:", error);
      throw error;
    }
  }

  private extractUsername(): string {
    const usernameElement = document.querySelector('[data-testid="UserName"]');
    return usernameElement?.textContent?.trim().split("@")[1] || "";
  }

  private extractBio(): string {
    const bioElement = document.querySelector(
      '[data-testid="UserDescription"]'
    );
    return bioElement?.textContent?.trim() || "";
  }

  private extractFollowCounts(): {
    followersCount: string;
    followingCount: string;
  } {
    const followElements = document.querySelectorAll(
      'a[href*="/following"], a[href*="/verified_followers"]'
    );

    let followersCount = "0";
    let followingCount = "0";

    followElements.forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (text.includes("Following")) {
        followingCount = text.replace("Following", "").trim();
      } else if (text.includes("Followers")) {
        followersCount = text.replace("Followers", "").trim();
      }
    });

    return { followersCount, followingCount };
  }

  private extractTweetData(tweetElement: Element): Tweet | null {
    try {
      const textElement = tweetElement.querySelector(
        '[data-testid="tweetText"]'
      );
      const text = textElement?.textContent?.trim() || "";

      // Skip empty tweets or those without text
      if (!text) return null;

      const timestamp =
        tweetElement.querySelector("time")?.getAttribute("datetime") || "";

      const statsElement = tweetElement.querySelectorAll(
        '[data-testid="app-text-transition-container"]'
      );
      const comments = statsElement[0]?.textContent || "0";
      const retweets = statsElement[1]?.textContent || "0";
      const likes = statsElement[2]?.textContent || "0";
      const views = statsElement[3]?.textContent || "0";

      return {
        id: text, // Using text as id since data-tweet-id is not available
        text,
        timestamp,
        likes,
        retweets,
        comments,
        views,
      };
    } catch (error) {
      console.error("Error extracting tweet data:", error);
      return null;
    }
  }

  private async waitForElement(selector: string): Promise<Element> {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector)!);
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector)!);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  public startObserving(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  public disconnect(): void {
    this.observer.disconnect();
  }

  private handleDOMChanges(mutations: MutationRecord[]): void {
    // Optional: Implement if you need to react to DOM changes
    // Currently not needed since we're using waitForElement for data extraction
  }
}

// Initialize the observer when the content script loads
const observer = TwitterPageObserver.getInstance();
observer.startObserving();
