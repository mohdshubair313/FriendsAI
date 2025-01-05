export const runtime = "nodejs"; // This forces the route to use Node.js runtime

import { handlers } from "@/auth";
export const { GET, POST } = handlers;
