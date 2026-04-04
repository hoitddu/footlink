import { getAppDataSource } from "@/lib/app-config";
import { CreateListingForm } from "@/components/create/create-listing-form";

export default function CreatePage() {
  return <CreateListingForm dataSource={getAppDataSource()} />;
}
