import { prisma } from "@/lib/db.js";
import {
  WorkoutPlanNotActiveError,
  WorkoutSessionAlreadyStartedError,
  UnauthorizedError,
  WorkoutDayNotFoundError,
} from "@/errors/index.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

interface OutputDto {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
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

    if (!workoutPlan.isActivate) {
      throw new WorkoutPlanNotActiveError();
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
    });

    if (!workoutDay || workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new WorkoutDayNotFoundError();
    }

    const existingSession = await prisma.workoutSession.findFirst({
      where: { workoutDayId: dto.workoutDayId },
    });

    if (existingSession && !existingSession.completedAt) {
      throw new WorkoutSessionAlreadyStartedError();
    }

    const session = await prisma.workoutSession.create({
      data: {
        workoutDayId: dto.workoutDayId,
        startedAt: new Date(),
      },
    });

    return {
      userWorkoutSessionId: session.id,
    };
  }
}
