import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "./api";
import type {
  Group,
  LeaderboardEntry,
  Match,
  MatchPredictions,
  Prediction,
  UserPredictionEntry,
  UserStats,
} from "./types";

export const queryKeys = {
  matches: ["matches"] as const,
  predictions: ["predictions"] as const,
  groups: ["groups"] as const,
  group: (id: string) => ["groups", id] as const,
  groupPredictions: (id: string) => ["groups", id, "predictions"] as const,
  leaderboard: ["leaderboard"] as const,
  me: ["me"] as const,
  userStats: (id: string) => ["userStats", id] as const,
};

export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: () => apiFetch<Match[]>("/matches"),
    refetchInterval: 60_000,
  });
}

export function useMyPredictions() {
  return useQuery({
    queryKey: queryKeys.predictions,
    queryFn: () => apiFetch<Prediction[]>("/predictions/me"),
  });
}

export function useSubmitPrediction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      match_id: string;
      home_score: number;
      away_score: number;
    }) => apiFetch<Prediction>("/predictions", { method: "POST", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.predictions });
    },
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => apiFetch<Group[]>("/groups/me"),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.group(id),
    queryFn: () => apiFetch<Group>(`/groups/${id}`),
  });
}

export function useGroupPredictions(id: string) {
  return useQuery({
    queryKey: queryKeys.groupPredictions(id),
    queryFn: () =>
      apiFetch<MatchPredictions[]>(`/groups/${id}/predictions`),
    refetchInterval: 60_000,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Group>("/groups", { method: "POST", body: { name } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invite_code: string) =>
      apiFetch<Group>("/groups/join", {
        method: "POST",
        body: { invite_code },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useGlobalLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: () => apiFetch<LeaderboardEntry[]>("/leaderboard"),
    refetchInterval: 60_000,
  });
}

export function useUserPredictions(userId: string | null) {
  return useQuery({
    queryKey: userId ? ["userPredictions", userId] : ["userPredictions", null],
    queryFn: () => apiFetch<UserPredictionEntry[]>(`/users/${userId}/predictions`),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useUserStats(userId: string | null) {
  return useQuery({
    queryKey: userId ? queryKeys.userStats(userId) : ["userStats", null],
    queryFn: () => apiFetch<UserStats>(`/users/${userId}/stats`),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/groups/${id}/leave`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}
