import { protectedProcedure, publicProcedure, router } from "../index";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";
import { projectRouter } from "./project";
import { taskRouter } from "./task";
import { workspaceRouter } from "./workspace";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  privateData: protectedProcedure.query(({ ctx }) => ({
    message: "This is private",
    user: ctx.session.user,
  })),
  workspace: workspaceRouter,
  project: projectRouter,
  task: taskRouter,
  comment: commentRouter,
  notification: notificationRouter,
});
export type AppRouter = typeof appRouter;
