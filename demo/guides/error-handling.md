# Error Handling

Learn how to handle errors returned by the Petstore API gracefully.

## Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "code": 404,
  "type": "error",
  "message": "Pet not found"
}
```

## Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| `400` | Bad Request | Check your request parameters |
| `401` | Unauthorized | Verify your API key or token |
| `403` | Forbidden | You lack permission for this resource |
| `404` | Not Found | The resource doesn't exist |
| `405` | Method Not Allowed | Wrong HTTP method for this endpoint |
| `429` | Too Many Requests | Slow down — you've hit the rate limit |
| `500` | Internal Server Error | Retry after a short delay |

## Retry Strategy

For `429` and `5xx` errors, implement exponential backoff:

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);

    if (res.ok) return res.json();

    if (res.status === 429 || res.status >= 500) {
      const delay = Math.pow(2, i) * 1000;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    throw new Error(`API error: ${res.status}`);
  }
  throw new Error('Max retries exceeded');
}
```

## Validation Errors

`400` responses may include field-level details:

```json
{
  "code": 400,
  "type": "validation",
  "message": "Invalid input",
  "errors": [
    { "field": "name", "message": "Name is required" },
    { "field": "status", "message": "Must be one of: available, pending, sold" }
  ]
}
```
