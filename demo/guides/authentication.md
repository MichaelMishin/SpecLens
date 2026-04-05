# Authentication

The Petstore API supports multiple authentication methods. Choose the one that best fits your use case.

## API Key Authentication

The simplest way to authenticate is with an API key passed in the header:

```bash
curl -H "api_key: your-api-key" https://petstore3.swagger.io/api/v3/pet/1
```

> **Tip:** Never expose your API key in client-side code. Use a backend proxy for production applications.

## OAuth 2.0

For applications that act on behalf of users, use OAuth 2.0:

1. **Register your application** to get a `client_id` and `client_secret`
2. **Redirect the user** to the authorization URL
3. **Exchange the code** for an access token
4. **Use the token** in the `Authorization` header

```bash
curl -H "Authorization: Bearer your-access-token" \
  https://petstore3.swagger.io/api/v3/pet/1
```

## Security Best Practices

| Practice | Description |
|----------|-------------|
| Rotate keys | Regenerate API keys every 90 days |
| Use HTTPS | Always use encrypted connections |
| Least privilege | Request only the scopes you need |
| Store securely | Use environment variables, never hardcode |
