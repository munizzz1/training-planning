# AI Coding Agent Guidelines

This workspace contains a **Full-Stack Training Planning Application**. Below are essential guidelines to help AI agents be immediately productive.

## Code Style

- **TypeScript Strict Mode**: All code must pass `strict: true` TypeScript compilation
- **Import Sorting**: Use `eslint-plugin-simple-import-sort`—imports are automatically sorted alphabetically by plugin
- **Formatting**: Code is formatted with Prettier (see `.vscode/settings.json` for rules)
- **Path Aliases**: Use `@/*` imports (e.g., `import { prisma } from "@/lib/db.js"`) instead of relative paths
- **File Extensions**: Always use `.js` extensions in import statements for ES modules (e.g., `"./auth.js"`)

## Architecture

The backend follows a **layered architecture** pattern:

- **Routes** (`src/routes/`): Fastify route handlers with Zod type provider. Each route:
  - Validates input with Zod schemas
  - Checks authentication via `better-auth`
  - Delegates business logic to use cases
  - Returns typed responses using `ZodTypeProvider`
  
- **Use Cases** (`src/usecases/`): Business logic classes (e.g., `CreateWorkoutPlan`). Pattern:
  - Single class per use case
  - `execute(dto)` method with structured input
  - May use Prisma transactions for multi-step operations
  
- **Schemas** (`src/schemas/`): Zod validation schemas for API requests/responses

- **Library** (`src/lib/`):
  - `db.ts`: Prisma client instance
  - `auth.ts`: Better-auth configuration
  
- **Database**: PostgreSQL via Prisma ORM (v7.4.2)
  - Generated client in `src/generated/prisma/`
  - Do not manually edit generated files

## Build and Test

**Development Server**:
```bash
pnpm dev  # or npm run dev
```
Runs `tsx watch` with `.env` file support on port 3333

**Node Version**: Requires Node.js 24.x (see `engines` in `package.json`)

**Database Operations**:
- Schema changes: Edit `prisma/schema.prisma`
- Run migrations: `pnpm prisma migrate dev --name <migration_name>`
- Reset database: `pnpm prisma migrate reset`
- Inspect data: `pnpm prisma studio`

## Project Conventions

### Route Pattern

Routes use Fastify with Zod type provider. Example (see [src/routes/workout-plan.ts](../src/routes/workout-plan.ts)):

```typescript
app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/",
  schema: {
    body: ZodSchema,
    response: {
      201: SuccessSchema,
      400: ErrorSchema,
    },
  },
  handler: async (request, reply) => {
    // Validate session, delegate to use case, return typed response
  },
});
```

### Database Models

- **Naming**: Table names are snake_case (e.g., `@@map("workout_plans")`)
- **IDs**: Use `@id @default(uuid())` for primary keys
- **Timestamps**: Use `DateTime @db.Timestamptz()` for database-level timezone support
- **Relationships**: Always specify `onDelete: Cascade` for referential integrity

### Use Case Pattern

Use cases are classes with a single public `execute()` method:

```typescript
export class CreateWorkoutPlan {
  async execute(dto: InputDto) {
    // Validation and business logic here
    return prisma.$transaction(async (prisma) => {
      // Multi-step operations in a transaction
    });
  }
}
```

## Integration Points

- **Authentication**: Via `better-auth` library. Always verify session before protected operations:
  ```typescript
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
  if (!session) return reply.status(401).send({ error: "Unauthorized" });
  ```

- **API Documentation**: Scalar API Reference generates docs from route schemas at `/docs`

- **CORS**: Configured for `http://localhost:3000` only (see `src/server.ts`)

- **Swagger/OpenAPI**: Fastify Swagger auto-generates schema from Zod definitions

## Security

- **Session Validation**: All protected routes must validate `better-auth` sessions before processing
- **User Isolation**: Always filter database queries by `userId` from authenticated session
- **CORS**: Strictly limited to `http://localhost:3000`—add origins to `src/server.ts` if expanding
- **Environment Variables**: Use `.env` file (loaded by `dotenv` in server startup); never commit secrets
- **Database Credentials**: Passed via `DATABASE_URL` from `.env`

---

**When Adding Features**: Create a new route in `src/routes/`, corresponding use case in `src/usecases/`, and schema in `src/schemas/`. Use existing patterns as templates.
