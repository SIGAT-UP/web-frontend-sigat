# Contratos

Aquí se fija el `openapi.json` que publica `backend-sigat`.

```bash
cp ../../backend-sigat/contracts/openapi.json src/contracts/
npx openapi-typescript src/contracts/openapi.json -o src/contracts/schema.d.ts
```

Reglas:

1. El contrato lo genera el backend; aquí no se edita a mano.
2. Cada actualización entra en un PR explícito y el cliente se regenera.
3. `src/lib/api/client.ts` se reemplaza por el cliente tipado de
   `openapi-fetch` cuando el contrato esté publicado.
