import type { Metadata } from "next";
import { WorkspaceApp } from "@/components/ui/WorkspaceApp";

export const metadata: Metadata = {
  title: "Design Your Workspace | monis.rent",
  description:
    "Interactively design your rental workspace: pick a desk, chair, monitors and more, then rent the whole setup.",
};

export default function DesignPage() {
  return <WorkspaceApp />;
}
