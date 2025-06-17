import { appRouter, createContext } from "@repo/api";

export const caller = appRouter.createCaller(createContext);
