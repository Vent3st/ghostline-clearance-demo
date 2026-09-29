import { redirect } from "next/navigation";

// Terms of Use (static HTML in /public/site).
export default function Terms() {
  redirect("/site/terms.html");
}
