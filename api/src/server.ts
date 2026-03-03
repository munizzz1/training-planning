import "dotenv/config";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get("/", async (request, reply) => {
  return { hello: "world" };
});

try {
  await app.listen({ port: Number(process.env.PORT) ?? 3333 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
