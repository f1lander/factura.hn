"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createClient,
  createClientWithServiceRole,
} from "@/lib/supabase/server";
import { companyService } from "./services/company";
import { SignupForm } from "@/app/auth/signup/page";
import { SignUpWithPasswordCredentials } from "@supabase/auth-js";

/**
 * Logs a user in using the provided form data.
 *
 * @async
 * @function login
 * @param {FormData} formData - The form data containing user login details.
 * @returns {Promise<{ success: boolean; message: string }>} A promise that resolves to an object indicating the success status and message.
 *
 * @description
 * Attempts to log a user in with an email and password extracted from the form data.
 * If the login attempt fails, an appropriate error message is returned based on the error code:
 * - `email_not_confirmed`: Indicates the email address has not been confirmed.
 * - `invalid_credentials`: Indicates incorrect email or password.
 * For any other errors, a general failure message is returned.
 *
 * @example
 * const formData = new FormData();
 * formData.append("email", "user@example.com");
 * formData.append("password", "password123");
 * const result = await login(formData);
 * console.log(result); // { success: true, message: "El inicio de sesión ha sido exitoso" }
 */

export async function login(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log(
      "Something went wrong when logging user in. The error looks like this: ",
      error,
    );
    if (error.code === "email_not_confirmed")
      return {
        success: false,
        message:
          "Aún no has confirmado tu dirección de correo electrónico. Revisa en tu bandeja de entrada un correo de confirmación y en él, dale click al enlace para confirmar tu correo electrónico",
      };
    if (error.code === "invalid_credentials")
      return {
        success: false,
        message:
          "Las credenciales son incorrectas. Revisa que tu dirección de correo electrónico y contraseña sean correctas",
      };
    return {
      success: false,
      message: "Algo salió mal con el inicio de sesión",
    };
  }
  return {
    success: true,
    message: "El inicio de sesión ha sido exitoso",
  };
}

/**
 * Registers a new user in the Supabase database.
 *
 * @async
 * @function signup
 * @param {FormData} formData - The form data containing user registration fields.
 * @param {string} formData.email - User's email address.
 * @param {string} formData.password - User's chosen password.
 * @param {string} formData.name - User's first name.
 * @param {string} formData.last_name - User's last name.
 * @returns {Promise<{ success: boolean; message: string }>} A promise resolving to an object with:
 * - `success` (boolean): Indicates if the registration was successful.
 * - `message` (string): Provides details about the operation's success or failure.
 *
 * @description
 * This function performs the following actions:
 * 1. Checks if a user with the provided email already exists.
 *    - If so, returns an error message without creating a new user.
 * 2. Attempts to register the user with Supabase Auth.
 *    - If registration fails, logs the error and returns a failure message.
 * 3. Inserts the user into the public "users" table if registration is successful.
 *    - Logs the result of the insertion and returns a success message.
 */

export async function signup(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClientWithServiceRole();

  const rtn = formData.get("rtn") as string;
  const company_name = formData.get("company_name") as string;

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
    last_name: formData.get("last_name") as string,
    options: {
      data: {
        name: formData.get("name") as string,
        last_name: formData.get("last_name") as string,
      },
    },
  };

  // 1. check if the user already exists
  const user = await supabase
    .from("users")
    .select("id")
    .eq("email", data.email);
  const userAlreadyExists: boolean = user.data!.length > 0;
  // 1.1 If the user already exists, return the function
  if (userAlreadyExists) {
    return {
      success: false,
      message:
        "El usuario ya existe. Si el inicio de sesión falla, intenta revisando tu bandeja de entrada y cliquear en el enlace de confirmación",
    };
  }

  // 2. Create the user
  const { data: registeredUserData, error: registrationError } =
    await supabase.auth.signUp(data);

  // 2.1 if something fails, return
  if (registrationError !== null || registeredUserData.user === null) {
    console.log(
      "Algo falló al crear un nuevo usuario. El error es el siguiente: ",
      registrationError,
    );
    if (registrationError?.code === "over_email_send_rate_limit")
      return {
        success: false,
        message:
          "Has alcanzado el límite de envíos de correo de confirmación. Por favor, intenta dentro de una hora",
      };
    return { success: false, message: "Hubo un fallo al crear el usuario" };
  }

  // 3. Add the user to the user table from the public schema
  const insertedUser = await supabase
    .from("users")
    .insert({
      id: registeredUserData.user!.id,
      email: data.email,
      name: data.name,
      last_name: data.last_name,
    })
    .select();
  console.log("The insertedUser is: ", insertedUser);
  // 4. Add information about the company
  const {
    success,
    message,
    data: companyData,
  } = await companyService.createCompanyv2(
    { name: company_name, rtn },
    registeredUserData.user!.id,
  );
  console.log("The company data is: ", companyData);
  if (!success) {
    console.log("Hubo un problema al intentar crear la companía");
    return { success: false, message };
  }
  return { success: true, message: "El usuario se ha creado exitosamente" };
}

/**
 * Handles the signup process for a new user, including account creation,
 * database entry, and associated company creation.
 *
 * @param {SignupForm} signupForm - An object containing user and company details for signup.
 * @param {string} signupForm.company_name - The name of the company associated with the user.
 * @param {string} signupForm.rtn - The company RTN (Registro Tributario Nacional).
 * @param {string} signupForm.full_name - The full name of the user.
 * @param {string} signupForm.email - The email address of the user.
 * @param {string} signupForm.password - The password for the user's account.
 *
 * @returns {Promise<{ success: boolean; message: string }>}
 * A promise that resolves to an object indicating whether the signup process was successful
 * and a corresponding message.
 *
 * @example
 * const signupForm = {
 *   company_name: "Acme Corp",
 *   rtn: "123456789",
 *   full_name: "John Doe",
 *   email: "johndoe@example.com",
 *   password: "securepassword123"
 * };
 *
 * signupv2(signupForm).then(response => {
 *   if (response.success) {
 *     console.log("Signup successful:", response.message);
 *   } else {
 *     console.error("Signup failed:", response.message);
 *   }
 * });
 */
export async function signupv2(
  signupForm: SignupForm,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClientWithServiceRole();

  const signupCredentials: SignUpWithPasswordCredentials = {
    email: signupForm.email,
    password: signupForm.password,
    options: {
      data: {
        full_name: signupForm.full_name,
      },
    },
  };

  // 1. check if the user already exists
  const user = await supabase
    .from("users")
    .select("id")
    .eq("email", signupForm.email);
  const userAlreadyExists: boolean = user.data!.length > 0;
  // 1.1 If the user already exists, return the function
  if (userAlreadyExists) {
    return {
      success: false,
      message:
        "El usuario ya existe. Si el inicio de sesión falla, intenta revisando tu bandeja de entrada y cliquear en el enlace de confirmación",
    };
  }

  // 2. Create the user
  const { data: registeredUserData, error: registrationError } =
    await supabase.auth.signUp(signupCredentials);

  // 2.1 if something fails, return
  if (registrationError !== null || registeredUserData.user === null) {
    console.log(
      "Algo falló al crear un nuevo usuario. El error es el siguiente: ",
      registrationError,
    );
    if (registrationError?.code === "over_email_send_rate_limit")
      return {
        success: false,
        message:
          "Has alcanzado el límite de envíos de correo de confirmación. Por favor, intenta dentro de una hora",
      };
    return { success: false, message: "Hubo un fallo al crear el usuario" };
  }

  // 3. Add the user to the user table from the public schema
  const insertedUser = await supabase
    .from("users")
    .insert({
      id: registeredUserData.user.id,
      email: signupForm.email,
      full_name: signupForm.full_name,
    })
    .select();
  console.log("The insertedUser is: ", insertedUser);

  // 4. Add information about the company
  const {
    success,
    message,
    data: companyData,
  } = await companyService.createCompanyv2(
    {
      name: signupForm.company_name,
      rtn: signupForm.rtn,
      email: signupForm.email,
      ceo_name: signupForm.full_name,
    },
    registeredUserData.user!.id,
  );
  console.log("The company data is: ", companyData);
  if (!success) {
    console.log("Hubo un problema al intentar crear la companía");
    return { success: false, message };
  }
  return { success: true, message: "El usuario se ha creado exitosamente" };
}

export async function logout() {
  const supabase = createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "page");
  redirect("/");
}

export async function checkUserExistence(
  signupForm: SignupForm,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  const user = await supabase
    .from("users")
    .select("id")
    .eq("email", signupForm.email);
  const userAlreadyExists: boolean = Boolean(user.data?.length);
  // 1.1 If the user already exists, return the function
  if (userAlreadyExists) {
    return {
      success: false,
      message:
        "El usuario ya existe. Si el inicio de sesión falla, intenta revisando tu bandeja de entrada y cliquear en el enlace de confirmación",
    };
  }
  return {
    success: true,
    message: "",
  };
}

export async function createUser(
  signupForm: SignupForm,
): Promise<{ success: boolean; message: string; userId?: string }> {
  const supabase = createClient();
  const signupCredentials: SignUpWithPasswordCredentials = {
    email: signupForm.email,
    password: signupForm.password,
    options: {
      data: {
        full_name: signupForm.full_name,
      },
    },
  };

  const { data: registeredUserData, error: registrationError } =
    await supabase.auth.signUp(signupCredentials);

  // 2.1 if something fails, return
  if (registrationError !== null || registeredUserData.user === null) {
    console.log(
      "Algo falló al crear un nuevo usuario. El error es el siguiente: ",
      registrationError,
    );
    if (registrationError?.code === "over_email_send_rate_limit")
      return {
        success: false,
        message:
          "Has alcanzado el límite de envíos de correo de confirmación. Por favor, intenta dentro de una hora",
      };
    return { success: false, message: "Hubo un fallo al crear el usuario" };
  }
  return { success: true, message: "", userId: registeredUserData.user.id };
}

export async function addUserAndCompany(
  signupForm: SignupForm,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  const insertedUser = await supabase
    .from("users")
    .insert({
      id: userId,
      email: signupForm.email,
      full_name: signupForm.full_name,
    })
    .select();
  console.log("The insertedUser is: ", insertedUser);

  // 4. Add information about the company
  const {
    success,
    message,
    data: companyData,
  } = await companyService.createCompanyv2(
    { name: signupForm.company_name, rtn: signupForm.rtn },
    userId,
  );
  console.log("The company data is: ", companyData);
  if (!success) {
    console.log("Hubo un problema al intentar crear la companía");
    return { success: false, message };
  }
  return { success: true, message: "El usuario se ha creado exitosamente" };
}
