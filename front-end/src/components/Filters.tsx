import { Flex, NumberInput, TextInput } from "@mantine/core";
import { IconCurrencyEuro, IconWalk } from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";

interface FiltersProps {
  activity: string | undefined;
  price: number | undefined;
  setSearchActivity: Dispatch<SetStateAction<string | undefined>>;
  setSearchPrice: Dispatch<SetStateAction<number | undefined>>;
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
