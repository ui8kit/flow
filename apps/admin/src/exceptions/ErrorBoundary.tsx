import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { Block, Stack, Title, Text, Button } from '@ui8kit/core'

export default function ErrorBoundary() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : 500
  const message = isRouteErrorResponse(error) ? error.statusText : 'Something went wrong'
  return (
    <Block component="main" py="lg">
      <Stack gap="md">
        <Title order={1} size="2xl">{status} {message}</Title>
        <Text c="secondary-foreground">Try searching or go back to the homepage.</Text>
        <Link to="/"><Button size="sm">Go Home</Button></Link>
      </Stack>
    </Block>
  )
}


