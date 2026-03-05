import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";

import {
  ErrorSchema,
  GetUserTrainDataResponseSchema,
  UpsertUserTrainDataBodySchema,
  UpsertUserTrainDataResponseSchema,
} from "@/schemas/index.js";
import { GetUserTrainData } from "@/usecases/GetUserTrainData.js";
import { UpsertUserTrainData } from "@/usecases/UpsertUserTrainData.js";
import { auth } from "@/lib/auth.js";

export const userRoute = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/me",
    schema: {
      tags: ["User"],
      summary: "Get user training data for the authenticated user",
      response: {
        200: GetUserTrainDataResponseSchema.nullable(),
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

      const getUserTrainData = new GetUserTrainData();
      const result = await getUserTrainData.execute({
        userId: session.user.id,
      });

      reply.status(200).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/me",
    schema: {
      tags: ["User"],
      summary: "Upsert user training data for the authenticated user",
      body: UpsertUserTrainDataBodySchema,
      response: {
        200: UpsertUserTrainDataResponseSchema,
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

      const upsertUserTrainData = new UpsertUserTrainData();
      const result = await upsertUserTrainData.execute({
        userId: session.user.id,
        weightInGrams: request.body.weightInGrams,
        heightInCentimeters: request.body.heightInCentimeters,
        age: request.body.age,
        bodyFatPercentage: request.body.bodyFatPercentage,
      });

      reply.status(200).send(result);
    },
  });
};
