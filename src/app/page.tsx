
import { auth } from "@/auth";
import ClientHomepage from "./ClientHomepage";

export default async function Home() {
  // Fetching the user seeion on the server side

  const session = await auth();
  const user = session?.user;

    return (
      <>
      <ClientHomepage user={user} />        
      </>
    );
}
