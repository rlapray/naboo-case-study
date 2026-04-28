import { Paper } from "@mantine/core";
import Head from "next/head";
import { PageTitle, SigninForm } from "@/components";
import { withoutAuth } from "@/hocs";

const Signin = () => {
  return (
    <>
      <Head>
        <title>Connexion | CDTR</title>
      </Head>
      <PageTitle title="Connexion" />
      <Paper shadow="xs" p="md">
        <SigninForm />
      </Paper>
    </>
  );
};

export default withoutAuth(Signin);
