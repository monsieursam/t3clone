import { pgEnum } from "drizzle-orm/pg-core";
import { decimal } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text('id').primaryKey(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  email: text("email"),
  image_url: text("image_url"),
  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
})

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system', 'data']);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  // I will fix it later
  images: text('images').array(),
  userId: text("user_id").references(() => users.id, { onDelete: 'cascade' }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  llmId: uuid('llm_id')
    .references(() => llms.id, { onDelete: 'set null' }),
  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const capacityEnum = pgEnum('capacity', ['image', 'text', 'code'])

export const llms = pgTable('llm', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  provider: text('provider'),
  pricing_input: decimal('pricing_input', { precision: 10, scale: 2 }),
  pricing_output: decimal('pricing_output', { precision: 10, scale: 2 }),
  capacity: capacityEnum('capacity').array(),

  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});


export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  ownerId: text("owner_id").references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp({ mode: 'date', precision: 3 }).defaultNow(),
  updatedAt: timestamp({ mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const schema = {
  users,
  messages,
  conversations,
  llms
}

export type LLM = typeof llms.$inferSelect;
