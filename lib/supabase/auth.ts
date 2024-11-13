"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createClient,
  createClientWithServiceRole,
} from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return error;
  }
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

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
    last_name: formData.get("last_name") as string,
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
  if (registrationError !== null && registeredUserData === null) {
    console.log(
      "Algo falló al crear un nuevo usuario. El error es el siguiente: ",
      registrationError,
    );
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
  return { success: true, message: "El usuario se ha creado exitosamente" };
}

export async function logout() {
  const supabase = createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "page");
  redirect("/");
}
