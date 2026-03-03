import type { Weekday } from "@/generated/prisma/enums.js";
import { prisma } from "@/lib/db.js";
import { tr } from "zod/v4/locales";

interface InputDto {
  userId: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: Weekday;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export class CreateWorkoutPlan {
  async execute(dto: InputDto) {
    const existingWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActivate: true,
      },
    });

    return prisma.$transaction(async (prisma) => {
      if (existingWorkoutPlan) {
        await prisma.workoutPlan.update({
          where: { id: existingWorkoutPlan.id },
          data: { isActivate: false },
        });
      }

      const result = await prisma.workoutPlan.create({
        data: {
          name: dto.name,
          userId: dto.userId,
          isActivate: true,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay) => ({
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              isRest: workoutDay.isRest,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              exercises: {
                create: workoutDay.exercises.map((exercise) => ({
                  order: exercise.order,
                  name: exercise.name,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
      });
      return result;
    });
  }
}
