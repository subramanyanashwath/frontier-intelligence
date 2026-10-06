import type { RecommendationAdapter, RecommendationMessage } from "@/lib/ingestion/recommendations/types";

export const mockRecommendations: RecommendationMessage[] = [
  {
    sourceMessageId: "mock-msg-1",
    recommendedAt: "2026-09-12",
    subject: "Recommended role: Senior Data Scientist — FDE",
    rank: 1,
    roleTitle: "Senior Data Scientist — FDE",
    roleUrl: null,
    metadata: { isDemo: true, adapter: "mock" },
  },
  {
    sourceMessageId: "mock-msg-2",
    recommendedAt: "2026-09-20",
    subject: "Recommended role: Software Engineer, Agent Evaluations",
    rank: 2,
    roleTitle: "Software Engineer, Agent Evaluations",
    roleUrl: null,
    metadata: { isDemo: true, adapter: "mock" },
  },
];

export const mockRecommendationAdapter: RecommendationAdapter = {
  name: "mock",
  isConfigured: () => true,
  fetchRecommendations: async () => mockRecommendations,
};
