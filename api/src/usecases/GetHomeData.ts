import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { prisma } from "@/lib/db.js";
import { WorkoutDayNotFoundError, UnauthorizedError } from "@/errors/index.js";
import { Weekday } from "@/generated/prisma/enums.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  date: string; // YYYY-MM-DD
}

interface TodayWorkoutDay {
  workoutPlanId: string;
  id: string;
  name: string;
  isRest: boolean;
  weekDay: Weekday;
  estimatedDurationInSeconds: number;
  coverImageUrl?: string;
  exercisesCount: number;
}

interface ConsistencyDay {
  workoutDayCompleted: boolean;
  workoutDayStarted: boolean;
}

interface OutputDto {
  activeWorkoutPlanId: string;
  todayWorkoutDay: TodayWorkoutDay;
  workoutStreak: number;
  consistencyByDay: Record<string, ConsistencyDay>;
}

export class GetHomeData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const dateObj = dayjs.utc(dto.date, "YYYY-MM-DD");

    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActivate: true,
      },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true,
          },
        },
      },
    });

    if (!activeWorkoutPlan) {
      throw new WorkoutDayNotFoundError();
    }

    const dayOfWeek = dateObj.day();
    const weekdayMap: Record<number, Weekday> = {
      0: Weekday.SUNDAY,
      1: Weekday.MONDAY,
      2: Weekday.TUESDAY,
      3: Weekday.WEDNESDAY,
      4: Weekday.THURSDAY,
      5: Weekday.FRIDAY,
      6: Weekday.SATURDAY,
    };

    const todayWeekday = weekdayMap[dayOfWeek];
    const todayWorkoutDayData = activeWorkoutPlan.workoutDays.find(
      (day) => day.weekDay === todayWeekday,
    );

    if (!todayWorkoutDayData) {
      throw new WorkoutDayNotFoundError();
    }

    const todayWorkoutDay: TodayWorkoutDay = {
      workoutPlanId: activeWorkoutPlan.id,
      id: todayWorkoutDayData.id,
      name: todayWorkoutDayData.name,
      isRest: todayWorkoutDayData.isRest,
      weekDay: todayWeekday,
      estimatedDurationInSeconds:
        todayWorkoutDayData.estimatedDurationInSeconds,
      coverImageUrl: todayWorkoutDayData.coverImageUrl || undefined,
      exercisesCount: todayWorkoutDayData.workoutExercises.length,
    };

    const weekStart = dateObj.startOf("week").utc();
    const weekEnd = dateObj.endOf("week").utc();

    const sessionsThisWeek = await prisma.workoutSession.findMany({
      where: {
        startedAt: {
          gte: weekStart.toDate(),
          lte: weekEnd.toDate(),
        },
        workoutDay: {
          workoutPlanId: activeWorkoutPlan.id,
        },
      },
      include: {
        workoutDay: true,
      },
    });

    const consistencyByDay: Record<string, ConsistencyDay> = {};
    let currentDay = weekStart;

    while (currentDay.isBefore(weekEnd) || currentDay.isSame(weekEnd)) {
      const dateStr = currentDay.format("YYYY-MM-DD");
      consistencyByDay[dateStr] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
      currentDay = currentDay.add(1, "day");
    }

    for (const session of sessionsThisWeek) {
      const sessionDate = dayjs.utc(session.startedAt).format("YYYY-MM-DD");

      if (consistencyByDay[sessionDate]) {
        consistencyByDay[sessionDate].workoutDayStarted = true;

        if (session.completedAt) {
          consistencyByDay[sessionDate].workoutDayCompleted = true;
        }
      }
    }

    let workoutStreak = 0;
    for (const day of activeWorkoutPlan.workoutDays) {
      const sessions = sessionsThisWeek.filter(
        (session) => session.workoutDayId === day.id,
      );

      const isDayCompleted =
        sessions.length > 0 && sessions.some((s) => s.completedAt !== null);
      if (isDayCompleted || day.isRest) {
        workoutStreak++;
      }
    }

    return {
      activeWorkoutPlanId: activeWorkoutPlan.id,
      todayWorkoutDay,
      workoutStreak,
      consistencyByDay,
    };
  }
}
