import { AppBreadcrumbs, type BreadcrumbItem } from "@/app/component/appBreadcrumbs";

export type CreateBreadcrumbItem = BreadcrumbItem;

export const CreateBreadcrumbs = ({ items }: { items: CreateBreadcrumbItem[] }) => (
  <AppBreadcrumbs items={items} />
);
