import * as z from 'zod';

export const createMatchSchema = z.object({
  // Define fields
  name: z.string(),
});

export const MatchSchemaValidation = {
createMatchSchema
};
  