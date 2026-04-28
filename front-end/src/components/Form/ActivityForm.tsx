import { useMutation } from "@apollo/client";
import { Box, Button, Group, Select, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type {
  CreateActivityInput,
  CreateActivityMutation,
  CreateActivityMutationVariables,
} from "@/graphql/generated/types";
import CreateActivity from "@/graphql/mutations/activity/createActivity";
import { useDebounced, useSnackbar } from "@/hooks";
import { searchCity } from "@/services";
import {
  cityValidation,
  descriptionValidation,
  nameValidation,
  priceValidation,
} from "./validationRules";

interface SelectData {
  value: string;
  label: string;
}

export default function ActivityForm() {
  const snackbar = useSnackbar();
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounced(searchValue, 300);
  const [displayedCities, setDisplayedCities] = useState<SelectData[]>([]);
  const router = useRouter();

  const [createActivity] = useMutation<
    CreateActivityMutation,
    CreateActivityMutationVariables
  >(CreateActivity);

  const form = useForm<CreateActivityInput>({
    initialValues: {
      name: "",
      description: "",
      city: "",
      price: 0,
    },
    validate: {
      name: nameValidation,
      description: descriptionValidation,
      city: cityValidation,
      price: priceValidation,
    },
  });

  useEffect(() => {
    if (debouncedSearch) {
      searchCity(debouncedSearch)
        .then((data) => {
          setDisplayedCities(data.map((d) => ({ value: d.nom, label: d.nom })));
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Une erreur est survenue";
          snackbar.error(message);
        });
    }
  }, [debouncedSearch, searchValue, snackbar]);

  const handleSubmit = async (values: CreateActivityInput) => {
    try {
      setIsLoading(true);
      await createActivity({
        variables: {
          createActivityInput: { ...values, price: Number(values.price) },
        },
      });
      router.back();
    } catch (err) {
      snackbar.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maw={450} mx="auto">
      <form onSubmit={form.onSubmit((values) => void handleSubmit(values))}>
        <TextInput
          withAsterisk
          label="Nom de l'activité"
          placeholder="Session Yoga"
          {...form.getInputProps("name")}
        />
        <Textarea
          withAsterisk
          label="Description"
          placeholder="Description de l'activité"
          {...form.getInputProps("description")}
        />
        <Select
          withAsterisk
          label="Localisation"
          placeholder="Rouen"
          searchable
          onSearchChange={setSearchValue}
          searchValue={searchValue}
          data={displayedCities}
          {...form.getInputProps("city")}
        />
        <TextInput
          withAsterisk
          label="Prix"
          placeholder="50"
          type="number"
          {...form.getInputProps("price")}
        />
        <Group position="right" mt="md">
          <Button loading={isLoading} type="submit">
            Valider
          </Button>
        </Group>
      </form>
    </Box>
  );
}
