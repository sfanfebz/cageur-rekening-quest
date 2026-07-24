import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} belum diset.`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get leaderboardPasscode() {
    return process.env.LEADERBOARD_PASSCODE || "MantappuJiwa";
  },
  get sessionSecret() {
    return process.env.SESSION_SECRET || "cageur-rekening-quest-dev-secret";
  },
};
