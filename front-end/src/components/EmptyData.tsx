import { Flex } from "@mantine/core";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import emptyDataRaw from "../../public/images/undraw_no_data_re_kwbl.svg";

const emptyDataSvg = emptyDataRaw as StaticImageData;

export function EmptyData() {
  return (
    <Flex direction="column" align="center" justify="center" w="100%" m="xl">
      <p>Aucune donnée pour le moment</p>
      <Image priority src={emptyDataSvg} alt="No data" height={250} />
    </Flex>
  );
}
