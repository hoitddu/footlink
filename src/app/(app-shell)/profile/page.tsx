import { getAppDataSource } from "@/lib/app-config";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCurrentProfile } from "@/lib/repositories/profiles";

type ProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolved = await searchParams;
  const returnTo = Array.isArray(resolved.returnTo) ? resolved.returnTo[0] : resolved.returnTo;
  const profile =
    getAppDataSource() === "supabase" ? await getCurrentProfile() : undefined;

  return <ProfileForm profile={profile} returnTo={returnTo} />;
}
