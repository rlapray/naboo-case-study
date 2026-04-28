import { Box, Burger, Container, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useAuth } from "@/hooks";
import { getFilteredRoutes } from "./getFilteredRoutes";
import { MenuItem } from "./MenuItem";
import classes from "./Topbar.module.css";
import type { Route } from "./types";

interface TopbarProps {
  readonly routes: readonly Route[];
}

export function Topbar({ routes }: TopbarProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const { user } = useAuth();
  const filteredRoutes = getFilteredRoutes(routes, user);

  return (
    <Box className={classes.header}>
      <Container>
        <div className={classes.inner}>
          <Link href="/" className={classes.mainLink}>
            <h1 className={classes.title}>Candidator</h1>
          </Link>
          <Group gap={5} className={classes.links}>
            {filteredRoutes.map((route) => (
              <MenuItem key={route.label} {...route} />
            ))}
          </Group>
          <Burger
            opened={opened}
            onClick={toggle}
            className={classes.burger}
            size="sm"
            color="#fff"
          />
        </div>
      </Container>
    </Box>
  );
}
