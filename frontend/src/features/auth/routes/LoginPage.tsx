import { Anchor, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

/** Centered card layout hosting the sign-in form. */
export function LoginPage() {
  return (
    <Container size={420} my={80}>
      <Stack gap="lg">
        <Title order={2} ta="center">
          Log in to Tankha
        </Title>
        <Paper withBorder shadow="sm" p={30} radius="md">
          <LoginForm />
        </Paper>
        <Text ta="center" size="sm" c="dimmed">
          New here?{' '}
          <Anchor component={Link} to="/signup">
            Create an organisation
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
