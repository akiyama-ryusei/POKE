import { supabaseRestRequest } from "./supabaseRest";

const WINNERS = new Set(["player", "enemy"]);

function validateGameResult({ level, turns, winner }) {
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    throw new Error("level must be an integer between 1 and 3.");
  }

  if (!Number.isInteger(turns) || turns < 1) {
    throw new Error("turns must be a positive integer.");
  }

  if (!WINNERS.has(winner)) {
    throw new Error("winner must be either player or enemy.");
  }
}

export async function saveGameResult({ level, turns, winner }) {
  validateGameResult({ level, turns, winner });

  return supabaseRestRequest("game_results", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([{ level, turns, winner }]),
  });
}

export async function fetchLevelTurnHistogram(level) {
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    throw new Error("level must be an integer between 1 and 3.");
  }

  const query = new URLSearchParams({
    select: "level,turns,clear_count",
    level: `eq.${level}`,
    order: "turns.asc",
  });

  return supabaseRestRequest(`level_turn_histogram?${query.toString()}`);
}

export async function fetchAllLevelTurnHistograms() {
  const query = new URLSearchParams({
    select: "level,turns,clear_count",
    order: "level.asc,turns.asc",
  });

  return supabaseRestRequest(`level_turn_histogram?${query.toString()}`);
}
