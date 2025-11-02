import type { NextRequest } from "next/server";

/**
 * RL Training Environment Context
 *
 * Authentication is disabled for RL training purposes.
 * All requests are treated as authenticated with a default user.
 */
export async function createContext(req: NextRequest) {
	// No authentication required for RL training
	// Return empty context
	return {
		session: null as null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
