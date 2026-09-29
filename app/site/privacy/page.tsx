import { redirect } from "next/navigation";

// Privacy Policy (static HTML in /public/site).
export default function Privacy() {
  redirect("/site/privacy.html");
}
