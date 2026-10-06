import type { RecommendationAdapter } from "@/lib/ingestion/recommendations/types";

export const gmailRecommendationAdapter: RecommendationAdapter = {
  name: "gmail",
  isConfigured() {
    return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);
  },
  async fetchRecommendations() {
    if (!this.isConfigured()) {
      throw new Error("Gmail credentials are absent. Use the mock recommendation adapter.");
    }
    throw new Error("Gmail OAuth ingestion is deferred. The interface is in place; do not store mailbox contents yet.");
  },
};
