import { ownerHandlers } from "./ownerHandlers";
import { restaurantHandlers } from "./restaurantHandlers";

export const handlers = [...restaurantHandlers, ...ownerHandlers];
