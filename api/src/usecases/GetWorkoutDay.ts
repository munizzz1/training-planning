import { prisma } from "@/lib/db.js";
import { UnauthorizedError, WorkoutDayNotFoundError } from "@/errors/index.js";
import { Weekday } from "@/generated/prisma/enums.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
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

interface WorkoutSessionDto {
  id: string;
  workoutDayId: string;
  startedAt: string;
  completedAt?: string;
}

interface OutputDto {
  id: string;
  name: string;
  isRest: boolean;
  coverImageUrl?: string;
  estimatedDurationInSeconds: number;
  exercises: WorkoutExerciseDto[];
  weekDay: Weekday;
  sessions: WorkoutSessionDto[];
}

export class GetWorkoutDay {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan) {
      throw new WorkoutDayNotFoundError();
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError();
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
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
        workoutSessions: {
          select: {
            id: true,
            workoutDayId: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!workoutDay || workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new WorkoutDayNotFoundError();
    }

    const exercises: WorkoutExerciseDto[] = workoutDay.workoutExercises.map(
      (exercise) => ({
        id: exercise.id,
        name: exercise.name,
        order: exercise.order,
        workoutDayId: exercise.workoutDayId,
        sets: exercise.sets,
        reps: exercise.reps,
        restTimeInSeconds: exercise.restTimeInSeconds,
      }),
    );

    const sessions: WorkoutSessionDto[] = workoutDay.workoutSessions.map(
      (session) => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString(),
      }),
    );

    return {
      id: workoutDay.id,
      name: workoutDay.name,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl || undefined,
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      exercises,
      weekDay: workoutDay.weekDay,
      sessions,
    };
  }
}
