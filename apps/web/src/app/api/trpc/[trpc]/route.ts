import { createContext } from "@asana/api/context";
import { appRouter } from "@asana/api/routers/index";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req as any),
  });
}
export { handler as GET, handler as POST };
