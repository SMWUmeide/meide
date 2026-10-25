import {sqliteTable,text,integer} from "drizzle-orm/sqlite-core";
export const rooms=sqliteTable("rooms",{id:text("id").primaryKey(),data:text("data").notNull(),updated:integer("updated").notNull(),version:integer("version").notNull()});
