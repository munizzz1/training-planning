import { prisma } from "@/lib/db.js";
import { Weekday } from "@/generated/prisma/enums.js";

interface InputDto {
  userId: string;
  active?: boolean;
}

interface WorkoutExerciseDto {
  id: string;
  name: string;
  order: number;
  workoutDayId: string;
  sets: number;
  reps: number;
  restTimeInSeconds: number;
}

interface WorkoutDayDto {
  id: string;
  name: string;
  weekDay: Weekday;
  isRest: boolean;
  estimatedDurationInSeconds: number;
  coverImageUrl?: string;
  exercises: WorkoutExerciseDto[];
}

interface WorkoutPlanDto {
  id: string;
  name: string;
  isActivate: boolean;
  workoutDays: WorkoutDayDto[];
}

export class GetWorkoutPlans {
  async execute(dto: InputDto): Promise<WorkoutPlanDto[]> {
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: {
        userId: dto.userId,
        ...(dto.active !== undefined && { isActivate: dto.active }),
      },
      include: {
        workoutDays: {
          include: {
            workoutExercises: {
              select: {
                id: true,
                name: true,
                order: true,
                workoutDayId: true,
                sets: true,
                reps: true,
                restTimeInSeconds: true,
              },
            },
          },
        },
      },
    });

    return workoutPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      isActivate: plan.isActivate,
      workoutDays: plan.workoutDays.map((day) => ({
        id: day.id,
        name: day.name,
        weekDay: day.weekDay,
        isRest: day.isRest,
        estimatedDurationInSeconds: day.estimatedDurationInSeconds,
        coverImageUrl: day.coverImageUrl || undefined,
        exercises: day.workoutExercises,
      })),
    }));
  }
}
