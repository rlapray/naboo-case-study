import { Paper } from "@mantine/core";
import Head from "next/head";
import { PageTitle } from "@/components";
import ActivityForm from "@/components/Form/ActivityForm";
import { withAuth } from "@/hocs";

const CreateActivity = () => {
  return (
    <>
      <Head>
        <title>Ajouter une activité | CDTR</title>
      </Head>
      <PageTitle title="Ajouter une activité" prevPath="/discover" />
      <Paper shadow="xs" p="md">
        <ActivityForm />
      </Paper>
    </>
  );
};

export default withAuth(CreateActivity);
