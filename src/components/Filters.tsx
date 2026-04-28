import { Flex, NumberInput, TextInput } from "@mantine/core";
import { IconCurrencyEuro, IconWalk } from "@tabler/icons-react";
import type { Dispatch, SetStateAction } from "react";

interface FiltersProps {
  readonly activity: string | undefined;
  readonly price: number | undefined;
  readonly setSearchActivity: Dispatch<SetStateAction<string | undefined>>;
  readonly setSearchPrice: Dispatch<SetStateAction<number | undefined>>;
}

export function Filters({
  activity,
  price,
  setSearchActivity,
  setSearchPrice,
}: FiltersProps) {
  return (
    <Flex
      gap="md"
      direction="column"
      style={{
        width: "100%",
        borderRadius: "var(--mantine-radius-md)",
        backgroundColor: "var(--mantine-color-gray-2)",
        padding: "var(--mantine-spacing-md)",
        position: "sticky",
        top: "10px",
      }}
    >
      <TextInput
        leftSection={<IconWalk />}
        placeholder="Activité"
        onChange={(e) => setSearchActivity(e.target.value || undefined)}
        value={activity}
      />
      <NumberInput
        leftSection={<IconCurrencyEuro />}
        placeholder="Prix max"
        onChange={(e) => setSearchPrice(Number(e) || undefined)}
        value={price}
      />
    </Flex>
  );
}
