import type { Metadata } from "next";
import AdminPopupLeadsList from "./AdminPopupLeadsList";

export const metadata: Metadata = {
  title: "Pop-up Form",
  description: "Trip planning leads captured by the website pop-up form.",
};

export default function AdminPopupFormPage() {
  return <AdminPopupLeadsList />;
}
