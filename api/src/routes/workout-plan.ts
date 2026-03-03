import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import z from "zod";

import { ErrorSchema, WorkoutPlanSchema } from "@/schemas/index.js";
import { CreateWorkoutPlan } from "@/usecases/CreateWorkoutPlan.js";
import { auth } from "@/lib/auth.js";

export const workoutPlanRoute = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      body: WorkoutPlanSchema.omit({ id: true }),
      response: {
        201: z.object({
          id: z.uuid(),
        }),
        400: ErrorSchema,
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

      const createWorkoutPlan = new CreateWorkoutPlan();
      const result = await createWorkoutPlan.execute({
        userId: session.user.id,
        ...request.body,
      });
      reply.status(201).send({ id: result.id });
    },
  });
};
