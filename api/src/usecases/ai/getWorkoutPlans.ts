import { tool } from "ai";
import { z } from "zod";

import { GetWorkoutPlans } from "@/usecases/GetWorkoutPlans.js";

export function getWorkoutPlans(userId: string) {
  return tool({
    description: "Busca todos os planos de treino do usuário autenticado.",
    inputSchema: z.object({}),
    execute: async () => {
      const getUseCase = new GetWorkoutPlans();
      return await getUseCase.execute({ userId });
    },
  });
}
