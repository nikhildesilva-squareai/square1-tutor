"use client";

import { useState } from "react";

interface MetricsData {
  totalMembers: number;
  activeMembers: number; // Last 7 days
  totalPosts: number;
  totalMessages: number;
  memberGrowth: number; // percentage
  engagementRate: number; // percentage
  averagePostsPerDay: number;
  peakActivityTime: string;
}

interface DailyData {
  date: string;
  members: number;
  posts: number;
  messages: number;
  engagement: number;
}

interface AnalyticsDashboardClientProps {
  communityId: string;
  metrics: MetricsData;
  dailyData: DailyData[];
  topContributors: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    postCount: number;
    messageCount: number;
  }>;
}

export function AnalyticsDashboardClient({
  communityId,
  metrics,
  dailyData,
  topContributors,
}: AnalyticsDashboardClientProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
            <p className="text-neutral-600 mt-1">Community engagement insights</p>
          </div>
          <div className="flex gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Members */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-600 mb-2">
              Total Members
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-neutral-900">
                {metrics.totalMembers.toLocaleString()}
              </h3>
              <span className="text-sm font-medium text-green-600">
                +{metrics.memberGrowth}%
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {metrics.activeMembers} active this week
            </p>
          </div>

          {/* Engagement Rate */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-600 mb-2">
              Engagement Rate
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-neutral-900">
                {metrics.engagementRate}%
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Members interacting this week
            </p>
          </div>

          {/* Total Posts */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-600 mb-2">
              Total Posts
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-neutral-900">
                {metrics.totalPosts.toLocaleString()}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {metrics.averagePostsPerDay} posts per day
            </p>
          </div>

          {/* Total Messages */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-600 mb-2">
              Direct Messages
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-neutral-900">
                {metrics.totalMessages.toLocaleString()}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Peak time: {metrics.peakActivityTime}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Activity Over Time */}
          <div className="col-span-2 bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Activity Trend</h3>
            <div className="h-64 flex items-end justify-around gap-2">
              {dailyData.slice(-7).map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gradient-to-b from-blue-500 to-blue-600 rounded-t opacity-75 hover:opacity-100 transition-opacity"
                    style={{
                      height: `${Math.max((day.engagement / Math.max(...dailyData.map(d => d.engagement))) * 100, 20)}%`
                    }}
                    title={`${day.engagement}% engagement`}
                  />
                  <p className="text-xs text-neutral-600">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="font-bold text-neutral-900 mb-4">Peak Hours</h3>
            <div className="space-y-3">
              {["9-10 AM", "2-3 PM", "8-9 PM"].map((hour, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-neutral-600">{hour}</p>
                    <p className="text-sm font-medium text-neutral-900">
                      {90 - idx * 15}%
                    </p>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${90 - idx * 15}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="font-bold text-neutral-900 mb-6">Top Contributors</h3>
          <div className="space-y-4">
            {topContributors.map((contributor, idx) => (
              <div
                key={contributor.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <img
                    src={
                      contributor.avatar_url ||
                      "https://via.placeholder.com/40"
                    }
                    alt={contributor.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900">
                      {contributor.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {contributor.postCount} posts • {contributor.messageCount}{" "}
                      messages
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">
                    {contributor.postCount + contributor.messageCount}
                  </p>
                  <p className="text-xs text-neutral-500">interactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
