export interface CustomAuthorizerEvent {
  type: string;
  methodArn: string;
  authorizationToken?: string;
}
