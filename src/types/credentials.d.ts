interface PasswordCredentialData {
  id: string;
  name?: string;
  password: string;
  iconURL?: string;
}

interface PasswordCredential extends Credential {
  readonly type: 'password';
  readonly password: string;
  readonly id: string;
  readonly name?: string;
  readonly iconURL?: string;
}

interface PasswordCredentialConstructor {
  new(data: PasswordCredentialData): PasswordCredential;
  prototype: PasswordCredential;
}

declare var PasswordCredential: PasswordCredentialConstructor;

interface CredentialCreationOptions {
  password?: PasswordCredentialData;
}

interface CredentialRequestOptions {
  password?: boolean;
  mediation?: 'silent' | 'optional' | 'required';
  signal?: AbortSignal;
}

interface CredentialsContainer {
  create(options: CredentialCreationOptions): Promise<Credential | null>;
  get(options?: CredentialRequestOptions): Promise<Credential | null>;
  preventSilentAccess(): Promise<void>;
  store(credential: Credential): Promise<Credential>;
}