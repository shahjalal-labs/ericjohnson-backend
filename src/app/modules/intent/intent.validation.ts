import * as z from 'zod';

export const createIntentSchema = z.object({
  // Define fields
  name: z.string(),
});

export const IntentSchemaValidation = {
createIntentSchema
};
  