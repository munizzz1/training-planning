import { Weekday } from "@/generated/prisma/enums.js";
import { tool } from "ai";
import { z } from "zod";

import { CreateWorkoutPlan } from "../CreateWorkoutPlan.js";

export function createWorkoutPlan(userId: string) {
  return tool({
    description: "Cria um novo plano de treino completo para o usuário.",
    inputSchema: z.object({
      name: z.string().describe("Nome do plano de treino"),
      workoutDays: z
        .array(
          z.object({
            name: z
              .string()
              .describe("Nome do dia (ex: Peito e Tríceps, Descanso)"),
            weekDay: z.enum(Weekday).describe("Dia da semana"),
            isRest: z
              .boolean()
              .describe("Se é dia de descanso (true) ou treino (false)"),
            estimatedDurationInSeconds: z
              .number()
              .describe(
                "Duração estimada em segundos (0 para dias de descanso)",
              ),
            coverImageUrl: z
              .url()
              .describe(
                "URL da imagem de capa do dia de treino. Usar as URLs de superior ou inferior conforme o foco muscular do dia.",
              ),
            exercises: z
              .array(
                z.object({
                  order: z.number().describe("Ordem do exercício no dia"),
                  name: z.string().describe("Nome do exercício"),
                  sets: z.number().describe("Número de séries"),
                  reps: z.number().describe("Número de repetições"),
                  restTimeInSeconds: z
                    .number()
                    .describe("Tempo de descanso entre séries em segundos"),
                }),
              )
              .describe("Lista de exercícios (vazia para dias de descanso)"),
          }),
        )
        .describe("Array com exatamente 7 dias de treino (MONDAY a SUNDAY)"),
    }),
    execute: async (input) => {
      const createWorkoutPlan = new CreateWorkoutPlan();
      return createWorkoutPlan.execute({
        userId,
        name: input.name,
        workoutDays: input.workoutDays,
      });
    },
  });
}
