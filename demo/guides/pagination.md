# Pagination

When querying endpoints that return lists, the API uses pagination to limit response sizes.

## How It Works

Pass `limit` and `offset` query parameters to control pagination:

```bash
curl "https://petstore3.swagger.io/api/v3/pet/findByStatus?status=available&limit=20&offset=0"
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Max items per page (1–100) |
| `offset` | integer | 0 | Number of items to skip |

## Example: Iterating All Pages

```javascript
async function fetchAllPets(status) {
  const pets = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const res = await fetch(
      `https://petstore3.swagger.io/api/v3/pet/findByStatus?status=${status}&limit=${limit}&offset=${offset}`
    );
    const page = await res.json();
    pets.push(...page);

    if (page.length < limit) break;
    offset += limit;
  }

  return pets;
}
```

> **Note:** Be mindful of rate limits when iterating through large datasets. Add delays between requests if needed.
