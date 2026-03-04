import { prisma } from "@/lib/db.js";
import { UnauthorizedError, WorkoutDayNotFoundError } from "@/errors/index.js";
import { Weekday } from "@/generated/prisma/enums.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
}

interface WorkoutDayDto {
  id: string;
  weekDay: Weekday;
  name: string;
  isRest: boolean;
  coverImageUrl?: string;
  estimatedDurationInSeconds: number;
  exercisesCount: number;
}

interface OutputDto {
  id: string;
  name: string;
  workoutDays: WorkoutDayDto[];
}

export class GetWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true,
          },
        },
      },
    });

    if (!workoutPlan) {
      throw new WorkoutDayNotFoundError();
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new UnauthorizedError();
    }

    const workoutDays: WorkoutDayDto[] = workoutPlan.workoutDays.map((day) => ({
      id: day.id,
      weekDay: day.weekDay,
      name: day.name,
      isRest: day.isRest,
      coverImageUrl: day.coverImageUrl || undefined,
      estimatedDurationInSeconds: day.estimatedDurationInSeconds,
      exercisesCount: day.workoutExercises.length,
    }));

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      workoutDays,
    };
  }
}
