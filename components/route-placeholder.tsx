import { Hammer } from "lucide-react";
import { PageHeader } from "./page-header";
import {
  Empty,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "./ui/empty";

/**
 * Foundation placeholder so every route in §7 exists and the nav never changes.
 * Replaced by the owning builder during the parallel build.
 */
export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  owner,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  owner: string;
}) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Empty>
        <EmptyIcon>
          <Hammer />
        </EmptyIcon>
        <EmptyTitle>Coming together</EmptyTitle>
        <EmptyDescription>{owner}</EmptyDescription>
      </Empty>
    </div>
  );
}
