"use server";

import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

const credentialsLogin = async (email: string, password: string) => {  
    if (!email || !password) {
      throw new Error("Please fill all the fields");
    }

    try {
        await signIn("credentials", {
            email,
            password,
        });
    } catch (error) {
        const err = error as CredentialsSignin;
        return err.cause;
    }
};

export default credentialsLogin;