import { EntryFlow } from "@/components/entry/entry-flow";
import { getAppDataSource } from "@/lib/app-config";
import { getCurrentProfile } from "@/lib/repositories/profiles";

export default async function EntryPage() {
  const initialProfile =
    getAppDataSource() === "supabase" ? await getCurrentProfile() : undefined;

  return <EntryFlow initialProfile={initialProfile} />;
}
