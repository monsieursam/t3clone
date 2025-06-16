import { pgEnum } from "drizzle-orm/pg-core";
import { decimal } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  first_name: varchar("first_name", { length: 256 }),
  last_name: varchar("last_name", { length: 256 }),
  email: varchar("email", { length: 256 }),
  image_url: varchar("image_url", { length: 256 }),
  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
})

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system', 'data']);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  userId: uuid("user_id").references(() => users.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  role: messageRoleEnum('role').notNull(),
  llmId: uuid('llm_id')
    .references(() => llms.id, { onDelete: 'set null' }),
  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const llms = pgTable('llm', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  provider: text('provider'),
  pricing_input: decimal('pricing_input', { precision: 10, scale: 2 }),
  pricing_output: decimal('pricing_output', { precision: 10, scale: 2 }),

  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()).notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  ownerId: uuid("owner_id").references(() => users.id),
  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const schema = {
  users,
  messages,
  conversations,
  llms
}
