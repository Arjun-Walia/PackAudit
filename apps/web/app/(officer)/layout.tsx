import { Workspace } from "@/components/officer/Workspace";
import { PRODUCT_NAME } from "@/lib/site";

export const metadata = { title: `Officer workspace — ${PRODUCT_NAME}` };

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Workspace>{children}</Workspace>;
}
