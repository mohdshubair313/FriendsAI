
import ClientHomepage from "./ClientHomepage";
import { SessionProvider } from "@/context/SessionContext";

export default async function Home() {

    return (
      <SessionProvider>
        <ClientHomepage />
      </SessionProvider>
    );
}
