import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getN8nWebhookData, getAllN8nWebhookData, saveN8nWebhookData } from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  n8n: router({
    getLatest: publicProcedure.query(async () => {
      return await getAllN8nWebhookData();
    }),
    getByType: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'string') return val;
        throw new Error('Expected string');
      })
      .query(async ({ input }) => {
        return await getN8nWebhookData(input);
      }),
    receiveWebhook: publicProcedure
      .input(z.object({
        dataType: z.string(),
        data: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        await saveN8nWebhookData(input.dataType, input.data);
        return { success: true, message: `Webhook data received for ${input.dataType}` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
