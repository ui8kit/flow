import { Block, Stack, Title, Text } from '@ui8kit/core'

export default function NotFound() {
  return (
    <Block component="main" py="lg">
      <Stack gap="lg">
        <Stack gap="md">
          <Title order={1} size="2xl">Page not found</Title>
          <Text c="secondary-foreground">Try searching for what you need:</Text>
        </Stack>
      </Stack>
    </Block>
  )
}


