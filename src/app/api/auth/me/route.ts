import { api, json } from "@/lib/api";
import { getCurrentUser, publicUser } from "@/lib/auth";

export const GET = api(async () => {
  const user = await getCurrentUser();
  return json({ user: user ? publicUser(user) : null });
});
