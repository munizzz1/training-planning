import "dotenv/config";
import Fastify from "fastify";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifySwagger from "@fastify/swagger";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifySwagger, {
  openapi: {
    info: { title: "Training Planning API", version: "1.0.0" },
    servers: [{ url: "http://localhost:3333" }],
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});

app.get("/", async (request, reply) => {
  return { hello: "world" };
});

try {
  await app.listen({ port: Number(process.env.PORT) ?? 3333 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
