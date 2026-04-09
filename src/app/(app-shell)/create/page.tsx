import { getAppDataSource } from "@/lib/app-config";
import { CreateListingForm } from "@/components/create/create-listing-form";

export default async function CreatePage() {
  const dataSource = getAppDataSource();

  return <CreateListingForm dataSource={dataSource} />;
}
