# Getting Started

Welcome to the **Petstore API**! This guide will walk you through the basics of using the API.

## Prerequisites

Before you begin, make sure you have:

- An API key (get one from your [dashboard](#))
- `curl` or any HTTP client installed
- Basic understanding of REST APIs

## Your First Request

Let's start by listing all available pets:

```bash
curl -X GET "https://petstore3.swagger.io/api/v3/pet/findByStatus?status=available" \
  -H "Accept: application/json" \
  -H "api_key: your-api-key"
```

You should receive a JSON array of pet objects:

```json
[
  {
    "id": 1,
    "name": "Buddy",
    "status": "available",
    "category": { "id": 1, "name": "Dogs" }
  }
]
```

## Next Steps

- Read the [Authentication guide](#/guide/authentication) to learn about securing your requests
- Check the [Pagination guide](#/guide/pagination) for handling large datasets
- Explore the full API Reference for all available endpoints
