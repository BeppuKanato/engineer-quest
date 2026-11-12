import { AppBreadcrumbs, type BreadcrumbItem } from "@/components/layouts/AppBreadcrumbs";

export type CreateBreadcrumbItem = BreadcrumbItem;

export const CreateBreadcrumbs = ({ items }: { items: CreateBreadcrumbItem[] }) => (
  <AppBreadcrumbs items={items} />
);
