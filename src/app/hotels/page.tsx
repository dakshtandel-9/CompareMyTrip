import { redirect } from "next/navigation";

export default function HotelsPage() {
  redirect("/packages?category=hotels");
}
