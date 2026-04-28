import { Paper } from "@mantine/core";
import Head from "next/head";
import { PageTitle, SignupForm } from "@/components";
import { withoutAuth } from "@/hocs";

const Signup = () => {
  return (
    <>
      <Head>
        <title>Inscription | CDTR</title>
      </Head>
      <PageTitle title="Inscription" />
      <Paper shadow="xs" p="md">
        <SignupForm />
      </Paper>
    </>
  );
};
export default withoutAuth(Signup);
