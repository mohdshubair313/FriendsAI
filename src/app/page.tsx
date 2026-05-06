
export const dynamic = "force-dynamic";

import ClientHomepage from "./ClientHomepage";

// SessionProvider is mounted once at the root layout — no need to nest it
// here. (Doing so would cause double session polling.)
export default async function Home() {
  return <ClientHomepage />;
}
