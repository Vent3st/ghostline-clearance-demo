import { redirect } from "next/navigation";

export default function Home() {
  // Public demo: no case gate. Land on the marketing site.
  redirect("/site");
}
