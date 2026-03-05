import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";

import {
  ErrorSchema,
  GetStatsQuerySchema,
  GetStatsResponseSchema,
} from "@/schemas/index.js";
import { GetStats } from "@/usecases/GetStats.js";
import { auth } from "@/lib/auth.js";

export const statsRoute = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Stats"],
      summary: "Get user statistics for a date range",
      querystring: GetStatsQuerySchema,
      response: {
        200: GetStatsResponseSchema,
        401: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      const getStats = new GetStats();
      const result = await getStats.execute({
        userId: session.user.id,
        from: request.query.from,
        to: request.query.to,
      });

      reply.status(200).send(result);
    },
  });
};
