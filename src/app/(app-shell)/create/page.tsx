import { getAppDataSource } from "@/lib/app-config";
import { CreateListingForm } from "@/components/create/create-listing-form";
import { getCurrentProfile } from "@/lib/repositories/profiles";

export default async function CreatePage() {
  const currentProfile =
    getAppDataSource() === "supabase" ? await getCurrentProfile() : undefined;

  return <CreateListingForm currentProfile={currentProfile} />;
}
