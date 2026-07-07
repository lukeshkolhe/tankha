import { Anchor, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { SignUpForm } from '../components/SignUpForm';

/** Centered card layout hosting the signup form. */
export function SignUpPage() {
  return (
    <Container size={420} my={80}>
      <Stack gap="lg">
        <Title order={2} ta="center">
          Set up your organisation
        </Title>
        <Paper withBorder shadow="sm" p={30} radius="md">
          <SignUpForm />
        </Paper>
        <Text ta="center" size="sm" c="dimmed">
          Already have an account?{' '}
          <Anchor component={Link} to="/login">
            Log in
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
