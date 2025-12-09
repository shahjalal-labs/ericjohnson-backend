import * as z from 'zod';

export const createFriendSchema = z.object({
  // Define fields
  name: z.string(),
});

export const FriendSchemaValidation = {
createFriendSchema
};
  