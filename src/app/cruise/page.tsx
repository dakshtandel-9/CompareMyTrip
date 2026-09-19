import { redirect } from "next/navigation";

export default function CruisePage() {
  redirect("/packages?category=cruise");
}
