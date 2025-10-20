import { Block, Grid, Stack, Box, Button, Title, Text  } from "@ui8kit/core";
import { useTheme } from '@ui8kit/core';

const content = {
  title: "Welcome to the dashboard",
  description: "This is the dashboard description"
}

export function Blank() {
  const { rounded } = useTheme();
  return (
    <Block w="full" component="section">
      <Stack gap="lg">
        <Title size="2xl" c="secondary-foreground" mt="lg" data-class="home-title">{content.title}</Title>
        <Grid cols="1-2-3" gap="none" data-class="home-grid">
          <Box className="col-span-2" data-class="home-description">
            <Text c="muted">{content.description}</Text>
          </Box>
          <Box className="col-span-1 flex" justify="end" align="end" data-class="home-button">
            <Button onClick={() => console.log("Button clicked")}>Click me</Button>
          </Box>
        </Grid>
        <Box p="md" rounded={rounded?.default} shadow="none" bg="card" border="1px" aspect="16/9" w="full"></Box>
      </Stack>
    </Block>
  );
}
