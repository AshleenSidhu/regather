import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// GET /me/export: downloads the signed-in user's own data as JSON. The database function
// only ever returns rows belonging to the caller.
export async function GET() {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return new Response("Could not export your data.", { status: 500 });

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="regather-my-data.json"',
      "cache-control": "no-store",
    },
  });
}
