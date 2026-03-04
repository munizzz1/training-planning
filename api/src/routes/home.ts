import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";

import {
  ErrorSchema,
  GetHomeDataParamsSchema,
  GetHomeDataResponseSchema,
} from "@/schemas/index.js";
import { GetHomeData } from "@/usecases/GetHomeData.js";
import { WorkoutDayNotFoundError } from "@/errors/index.js";
import { auth } from "@/lib/auth.js";

export const homeRoute = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:date",
    schema: {
      tags: ["Home"],
      summary: "Get home page data for the authenticated user",
      params: GetHomeDataParamsSchema,
      response: {
        200: GetHomeDataResponseSchema,
        401: ErrorSchema,
        404: ErrorSchema,
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

      try {
        const getHomeData = new GetHomeData();
        const result = await getHomeData.execute({
          userId: session.user.id,
          date: request.params.date,
        });
        reply.status(200).send(result);
      } catch (error) {
        if (error instanceof WorkoutDayNotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }

        throw error;
      }
    },
  });
};
