import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { prisma } from "@/lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  from: Date; // parsed from YYYY-MM-DD
  to: Date; // parsed from YYYY-MM-DD
}

interface ConsistencyDay {
  workoutDayCompleted: boolean;
  workoutDayStarted: boolean;
}

interface OutputDto {
  workoutStreak: number;
  consistencyByDay: Record<string, ConsistencyDay>;
  completedWorkoutsCount: number;
  conclusionRate: number;
  totalTimeInSeconds: number;
}

export class GetStats {
  async execute(dto: InputDto): Promise<OutputDto> {
    const sessions = await prisma.workoutSession.findMany({
      where: {
        startedAt: {
          gte: dto.from,
          lte: dto.to,
        },
        workoutDay: {
          workoutPlan: {
            userId: dto.userId,
          },
        },
      },
      include: {
        workoutDay: {
          include: {
            workoutPlan: true,
          },
        },
      },
    });

    const consistencyByDay: Record<string, ConsistencyDay> = {};
    let completedWorkoutsCount = 0;
    let totalTimeInSeconds = 0;

    for (const session of sessions) {
      const sessionDate = dayjs.utc(session.startedAt).format("YYYY-MM-DD");

      if (!consistencyByDay[sessionDate]) {
        consistencyByDay[sessionDate] = {
          workoutDayCompleted: false,
          workoutDayStarted: false,
        };
      }

      consistencyByDay[sessionDate].workoutDayStarted = true;

      if (session.completedAt) {
        consistencyByDay[sessionDate].workoutDayCompleted = true;
        completedWorkoutsCount++;

        const timeDiffMs =
          session.completedAt.getTime() - session.startedAt.getTime();
        const timeDiffSeconds = Math.round(timeDiffMs / 1000);
        totalTimeInSeconds += timeDiffSeconds;
      }
    }

    const conclusionRate =
      sessions.length > 0 ? completedWorkoutsCount / sessions.length : 0;

    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActivate: true,
      },
      include: {
        workoutDays: {
          orderBy: {
            weekDay: "asc",
          },
        },
      },
    });

    let workoutStreak = 0;
    if (activeWorkoutPlan) {
      for (const day of activeWorkoutPlan.workoutDays) {
        const daySessionsInRange = sessions.filter(
          (s) => s.workoutDayId === day.id && s.completedAt !== null,
        );

        if (daySessionsInRange.length > 0) {
          workoutStreak++;
        } else {
          break;
        }
      }
    }

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds,
    };
  }
}
