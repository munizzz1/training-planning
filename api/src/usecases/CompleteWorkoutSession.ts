import { prisma } from "@/lib/db.js";
import {
  UnauthorizedError,
  WorkoutDayNotFoundError,
} from "@/errors/index.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  workoutSessionId: string;
  completedAt: Date;
}

interface OutputDto {
  id: string;
  completedAt: string;
  startedAt: string;
}

export class CompleteWorkoutSession {
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
    });

    if (!workoutDay || workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new WorkoutDayNotFoundError();
    }

    const workoutSession = await prisma.workoutSession.findUnique({
      where: { id: dto.workoutSessionId },
    });

    if (!workoutSession || workoutSession.workoutDayId !== dto.workoutDayId) {
      throw new WorkoutDayNotFoundError();
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: dto.workoutSessionId },
      data: {
        completedAt: dto.completedAt,
      },
    });

    return {
      id: updatedSession.id,
      completedAt: updatedSession.completedAt!.toISOString(),
      startedAt: updatedSession.startedAt.toISOString(),
    };
  }
}
