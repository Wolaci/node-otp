import { z } from "zod";

export const authSigninInSchema = z.object({
    email: z.string({ message: 'Campo email é obrigatório'}).email('E-mail inválido')
})