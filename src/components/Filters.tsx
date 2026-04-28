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
      sx={(tm) => ({
        width: "100%",
        borderRadius: tm.radius.md,
        backgroundColor: tm.colors.gray[2],
        padding: tm.spacing.md,
        position: "sticky",
        top: "10px",
      })}
    >
      <TextInput
        icon={<IconWalk />}
        placeholder="Activité"
        onChange={(e) => setSearchActivity(e.target.value || undefined)}
        value={activity}
      />
      <NumberInput
        icon={<IconCurrencyEuro />}
        placeholder="Prix max"
        type="number"
        onChange={(e) => setSearchPrice(Number(e) || undefined)}
        value={price}
      />
    </Flex>
  );
}
