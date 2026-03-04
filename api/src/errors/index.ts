export class WorkoutPlanNotActiveError extends Error {
  constructor() {
    super("Workout plan is not active");
    this.name = "WorkoutPlanNotActiveError";
  }
}

export class WorkoutSessionAlreadyStartedError extends Error {
  constructor() {
    super("Workout session already started for this day");
    this.name = "WorkoutSessionAlreadyStartedError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "User is not authorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class WorkoutDayNotFoundError extends Error {
  constructor() {
    super("Workout day not found");
    this.name = "WorkoutDayNotFoundError";
  }
}
