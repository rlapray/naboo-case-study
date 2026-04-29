import { Box, Button, Group, Select, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCreateActivity, useDebounced, useSnackbar } from "@/hooks";
import { searchCity } from "@/services";
import type { CreateActivityInput } from "@/types/activity";
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
  const debouncedSearch = useDebounced(searchValue, 300);
  const [displayedCities, setDisplayedCities] = useState<SelectData[]>([]);
  const router = useRouter();
  const { isLoading, submit } = useCreateActivity({
    onSuccess: () => router.back(),
    onError: () => snackbar.error("Une erreur est survenue"),
  });

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
          const seen = new Set<string>();
          const options: SelectData[] = [];
          for (const d of data) {
            if (seen.has(d.nom)) continue;
            seen.add(d.nom);
            const label = d.departement?.nom
              ? `${d.nom} (${d.departement.nom})`
              : d.nom;
            options.push({ value: d.nom, label });
          }
          setDisplayedCities(options);
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Une erreur est survenue";
          snackbar.error(message);
        });
    }
  }, [debouncedSearch, searchValue, snackbar]);

  return (
    <Box maw={450} mx="auto">
      <form onSubmit={form.onSubmit((values) => void submit(values))}>
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
        <Group justify="flex-end" mt="md">
          <Button loading={isLoading} type="submit">
            Valider
          </Button>
        </Group>
      </form>
    </Box>
  );
}
