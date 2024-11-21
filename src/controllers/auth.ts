import { RequestHandler } from "express";
import { authSigninInSchema } from "../schemas/auth-signin";
import { authSignUpSchema } from "../schemas/auth-signup";
import { createUser, getUserByEmail } from "../services/user";
import { error } from "console";
import { generateOTP, validateOTP } from "../services/otp";
import { sendEmail } from "../libs/mailtrap";
import { authUseOTPSchema } from "../schemas/auth-useotp";
import { createJWT } from "../libs/jwt";


export const signin: RequestHandler = async (req, res) => {
    const data = authSigninInSchema.safeParse(req.body);
    if(!data.success){
        res.json({ error: data.error.flatten().fieldErrors });
        return;
    }

    const user = await getUserByEmail(data.data.email);
    if(!user){
        res.json({ error: 'Usuário não existe'});
        return;
    }

    const otp = await generateOTP(user.id);
    
    await sendEmail(
        user.email,
        'Seu código de acesso é: '+otp.code,
        'Digite seu código: '+otp.code
    );

    res.json({id: otp.id});
}

export const signup: RequestHandler = async (req, res) => {
    const data = authSignUpSchema.safeParse(req.body);
    if(!data.success){
        res.json({ error: data.error.flatten().fieldErrors });
        return;
    }

    const user = await getUserByEmail(data.data.email)
    if(user){
        return res.json({error: 'Já existe usuário com esse e-mail'});
    }

    const newUser = await createUser(data.data.name, data.data.email);
    res.status(201).json({ user: newUser});
}

export const useOTP: RequestHandler = async (req, res) =>{
    const data = authUseOTPSchema.safeParse(req.body);
    if(!data.success){
        res.json({ error: data.error.flatten().fieldErrors });
        return;
    }

    const user = await validateOTP(data.data.id, data.data.code);
    if(!user){
        res.json({ error: 'OTP inválido ou expirado'});
        return;
    }

    const token = createJWT(user.id);
    res.json({token, user});
    
}