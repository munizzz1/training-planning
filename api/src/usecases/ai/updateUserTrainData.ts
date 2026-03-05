import { tool } from "ai";
import { z } from "zod";

import { UpsertUserTrainData } from "@/usecases/UpsertUserTrainData.js";

export function updateUserTrainData(userId: string) {
  return tool({
    description: "Salva ou atualiza os dados de treino do usuário.",
    inputSchema: z.object({
      weightInGrams: z.number().describe("Peso em gramas"),
      heightInCentimeters: z.number().describe("Altura em centímetros"),
      age: z.number().describe("Idade do usuário"),
      bodyFatPercentage: z.number().describe("Percentual de gordura corporal (ex: 0.25 para 25%)"),
    }),
    execute: async (input) => {
      const upsertUseCase = new UpsertUserTrainData();
      return await upsertUseCase.execute({ userId, ...input });
    },
  });
}
