import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import z from "zod";

import {
  ErrorSchema,
  WorkoutPlanSchema,
  StartWorkoutSessionParamsSchema,
  StartWorkoutSessionResponseSchema,
} from "@/schemas/index.js";
import { CreateWorkoutPlan } from "@/usecases/CreateWorkoutPlan.js";
import { StartWorkoutSession } from "@/usecases/StartWorkoutSession.js";
import {
  WorkoutPlanNotActiveError,
  WorkoutSessionAlreadyStartedError,
  UnauthorizedError,
  WorkoutDayNotFoundError,
} from "@/errors/index.js";
import { auth } from "@/lib/auth.js";

export const workoutPlanRoute = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Workout Plan"],
      summary: "Create a workout plan",
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

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/:workoutPlanId/days/:workoutDayId/sessions",
    schema: {
      tags: ["Workout Plan"],
      summary: "Start a workout session",
      params: StartWorkoutSessionParamsSchema,
      response: {
        201: StartWorkoutSessionResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        409: ErrorSchema,
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
        const startWorkoutSession = new StartWorkoutSession();
        const result = await startWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId: request.params.workoutPlanId,
          workoutDayId: request.params.workoutDayId,
        });
        reply.status(201).send(result);
      } catch (error) {
        if (error instanceof WorkoutPlanNotActiveError) {
          return reply.status(400).send({
            error: error.message,
            code: "WORKOUT_PLAN_NOT_ACTIVE",
          });
        }

        if (error instanceof WorkoutSessionAlreadyStartedError) {
          return reply.status(409).send({
            error: error.message,
            code: "SESSION_ALREADY_STARTED",
          });
        }

        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            error: error.message,
            code: "UNAUTHORIZED",
          });
        }

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
