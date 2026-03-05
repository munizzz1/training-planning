import { tool } from "ai";
import { z } from "zod";

import { GetUserTrainData } from "@/usecases/GetUserTrainData.js";

export function getUserTrainData(userId: string) {
  return tool({
    description: "Busca os dados de treino do usuário autenticado.",
    inputSchema: z.object({}),
    execute: async () => {
      const getUseCase = new GetUserTrainData();
      return await getUseCase.execute({ userId });
    },
  });
}
