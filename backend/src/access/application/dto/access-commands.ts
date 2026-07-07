/** Command to register a new organisation and its owner user. */
export interface SignUpCommand {
  name: string;
  email: string;
  password: string;
  organisationName: string;
}

/** Query to authenticate an existing user. */
export interface LogInQuery {
  email: string;
  password: string;
}

/** The user as it crosses the API boundary — never includes the password hash. */
export interface UserView {
  id: string;
  name: string;
  email: string;
}

/** The organisation as it crosses the API boundary. */
export interface OrganisationView {
  id: string;
  name: string;
}

/** The response to signup and login: a bearer token plus the session it opens. */
export interface AuthResult {
  accessToken: string;
  user: UserView;
  organisation: OrganisationView;
}

/** The response to GET /auth/me: the authenticated user and their organisation. */
export interface SessionView {
  user: UserView;
  organisation: OrganisationView;
}
