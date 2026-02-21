# Configuración de Sign in with Apple - Guía Rápida

## 1. Obtener tus credenciales de Apple Developer

### Team ID
1. Ve a [Apple Developer](https://developer.apple.com/account)
2. Inicia sesión con tu cuenta de desarrollador
3. Ve a **Membership** en el menú lateral
4. Tu **Team ID** aparece en la sección de información (es un código de 10 caracteres, ej: `A1B2C3D4E5`)

### Key ID
- Ya lo tienes: `GN5TSTJ8U9` (viene en el nombre del archivo `.p8`)

### Service ID (Client ID)
- Ya lo tienes: `com.jhotech.smartspend.auth`

### Private Key (.p8)
- Ya lo tienes: `/Users/mac/Downloads/AuthKey_GN5TSTJ8U9.p8`

## 2. Generar el Secret Key (JWT)

1. Abre el archivo `generate-apple-secret.js`
2. Reemplaza `TU_TEAM_ID_AQUI` con tu Team ID real
3. Ejecuta en terminal:
   ```bash
   node generate-apple-secret.js
   ```
4. Copia el token JWT que se genera

## 3. Configurar en Supabase

1. Ve a Supabase Dashboard
2. Ve a **Authentication** > **Providers** > **Apple**
3. Activa el toggle "Enable Sign in with Apple"
4. Completa los campos:
   - **Client IDs**: `com.jhotech.smartspend.auth,com.jhotech.smartspend`
   - **Secret Key (for OAuth)**: Pega el JWT generado en el paso 2
5. Callback URL ya está configurada: `https://plvuebqjwjcheyxprlmg.supabase.co/auth/v1/callback`
6. Guarda los cambios

## 4. Verificar configuración

En Supabase deberías ver:
- ✅ "Enable Sign in with Apple" activado
- ✅ Client IDs configurados
- ✅ Secret Key (JWT) sin error
- ✅ Callback URL registrada

## 5. Notas importantes

- El JWT expira cada **6 meses**
- Deberás regenerar el Secret Key antes de que expire
- Guarda este archivo para cuando necesites regenerarlo
- No compartas tu archivo `.p8` ni el JWT generado

## Troubleshooting

### Error: "Secret key should be a JWT"
- Asegúrate de copiar el token completo (sin espacios extra)
- Verifica que el Team ID sea correcto
- Regenera el token ejecutando el script de nuevo

### Error: "Invalid client_id"
- Verifica que los Client IDs estén separados por comas
- Confirma que coincidan con los configurados en Apple Developer

### Error: "Invalid callback URL"
- Registra la callback URL en Apple Developer Center:
  1. Ve a tu Service ID
  2. Configura "Sign in with Apple"
  3. Agrega el dominio y la callback URL de Supabase
