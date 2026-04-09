import { getAppDataSource } from "@/lib/app-config";
import { ProfileForm } from "@/components/profile/profile-form";

type ProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolved = await searchParams;
  const returnTo = Array.isArray(resolved.returnTo) ? resolved.returnTo[0] : resolved.returnTo;
  const flash = Array.isArray(resolved.flash) ? resolved.flash[0] : resolved.flash;
  const dataSource = getAppDataSource();

  return (
    <ProfileForm
      dataSource={dataSource}
      returnTo={returnTo}
      flash={flash === "saved" ? "saved" : undefined}
    />
  );
}
