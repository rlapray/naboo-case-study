import { Box, Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import Link from "next/link";
import { useAuth } from "@/hooks";
import type { SignInInput } from "@/types/auth";
import { emailValidation, passwordValidation } from "./validationRules";

export default function SigninForm() {
  const { handleSignin, isLoading } = useAuth();
  const form = useForm<SignInInput>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: emailValidation,
      password: passwordValidation,
    },
  });

  return (
    <Box maw={450} mx="auto">
      <form onSubmit={form.onSubmit((values) => void handleSignin(values))}>
        <TextInput
          withAsterisk
          label="Email"
          placeholder="your@email.com"
          {...form.getInputProps("email")}
        />
        <TextInput
          withAsterisk
          label="Mot de passe"
          placeholder="*****"
          type="password"
          {...form.getInputProps("password")}
        />
        <Box mt="md" sx={{ display: "flex", justifyContent: "space-between" }}>
          <Link href="/signup">
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <span>Vous n&apos;avez pas encore de compte ?</span>
              <span>S&apos;inscrire</span>
            </Box>
          </Link>
          <Button loading={isLoading} type="submit">
            Valider
          </Button>
        </Box>
      </form>
    </Box>
  );
}
