export type RecommendationMessage = {
  sourceMessageId: string;
  recommendedAt: string;
  subject: string;
  rank: number | null;
  roleTitle: string | null;
  roleUrl: string | null;
  metadata: Record<string, unknown>;
};

export interface RecommendationAdapter {
  name: string;
  isConfigured(): boolean;
  fetchRecommendations(): Promise<RecommendationMessage[]>;
}
