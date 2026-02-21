#!/bin/bash
# ============================================
# Script para simular eventos de RevenueCat webhook
# ============================================
#
# Uso:
#   ./scripts/test-webhook.sh <evento> <user_id> [product_id]
#
# Eventos disponibles:
#   initial_purchase  - Simula compra inicial (trial)
#   purchase          - Simula compra inicial (pagada, sin trial)
#   renewal           - Simula renovación de suscripción
#   cancellation      - Simula cancelación
#   expiration        - Simula expiración
#   uncancellation    - Simula reactivación
#   product_change    - Simula cambio de plan
#   billing_issue     - Simula problema de pago
#   test              - Evento de prueba
#
# Product IDs disponibles:
#   co.smartspend.monthly   - Plan mensual (por defecto)
#   co.smartspend.annual    - Plan anual
#   co.smartspend.lifetime  - Plan de por vida
#
# Ejemplos:
#   ./scripts/test-webhook.sh initial_purchase abc123-user-id
#   ./scripts/test-webhook.sh initial_purchase abc123-user-id co.smartspend.annual
#   ./scripts/test-webhook.sh purchase abc123-user-id co.smartspend.lifetime
#   ./scripts/test-webhook.sh cancellation abc123-user-id
#   ./scripts/test-webhook.sh test abc123-user-id
#
# Prerequisitos:
#   1. Ejecutar la migración SQL en Supabase
#   2. Desplegar la Edge Function
#   3. Configurar REVENUECAT_WEBHOOK_SECRET
#
# ============================================

set -e

# ============================================
# CONFIGURACIÓN - ACTUALIZAR ESTOS VALORES
# ============================================

# Tu URL de Supabase (sin trailing slash)
SUPABASE_URL="${SUPABASE_URL:-https://qvzxdwilplizcgybqqsx.supabase.co}" #DEV
#SUPABASE_URL="${SUPABASE_URL:-https://plvuebqjwjcheyxprlmg.supabase.co}" #PROD
#SUPABASE_URL="${SUPABASE_URL:-https://plvuebqjwjcheyxprlmg.supabase.co}"

# El secret que configuraste con: npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=...
WEBHOOK_SECRET="${WEBHOOK_SECRET:-pVdYvGm3pfJU+DVbF5U3d7mSI30vxItNlt9v7bVO5po=}" #DEV
#WEBHOOK_SECRET="${WEBHOOK_SECRET:-xYZdRTq+omYt2Wph0XYLo5zTC0qZm52dZKvV7iC5Msk=}" #PROD
#WEBHOOK_SECRET="${WEBHOOK_SECRET:-xYZdRTq+omYt2Wph0XYLo5zTC0qZm52dZKvV7iC5Msk=}" #PROD


# Producto por defecto (plan mensual)
DEFAULT_PRODUCT="co.smartspend.monthly"

# ============================================
# ARGUMENTOS
# ============================================

EVENT_TYPE="${1:-test}"
USER_ID="${2:-test-user-id}"
PRODUCT_ID="${3:-$DEFAULT_PRODUCT}"

# URL completa del webhook
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/revenuecat-webhook"

# Timestamp actual en milisegundos
NOW_MS=$(date +%s)000
# 7 días en el futuro (para trial/subscription expiration)
SEVEN_DAYS_MS=$(( $(date +%s) + 604800 ))000
# 30 días en el futuro
THIRTY_DAYS_MS=$(( $(date +%s) + 2592000 ))000

# Event ID único
EVENT_ID="test-$(date +%s)-$(( RANDOM % 10000 ))"

# ============================================
# FUNCIONES
# ============================================

send_webhook() {
  local event_type="$1"
  local payload="$2"

  echo ""
  echo "================================================"
  echo "Enviando evento: $event_type"
  echo "Usuario: $USER_ID"
  echo "Producto: $PRODUCT_ID"
  echo "URL: $WEBHOOK_URL"
  echo "================================================"
  echo ""
  echo "Payload:"
  echo "$payload" | python3 -m json.tool 2>/dev/null || echo "$payload"
  echo ""
  echo "Respuesta:"
  echo ""

  curl -s -w "\n\nHTTP Status: %{http_code}\n" \
    -X POST "$WEBHOOK_URL" \
    -H "Authorization: Bearer $WEBHOOK_SECRET" \
    -H "Content-Type: application/json" \
    -d "$payload"

  echo ""
}

# ============================================
# EVENTOS
# ============================================

case "$EVENT_TYPE" in
  initial_purchase|trial)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $SEVEN_DAYS_MS,
    "period_type": "TRIAL",
    "currency": "USD",
    "price": 0,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "INITIAL_PURCHASE (Trial)" "$PAYLOAD"
    ;;

  purchase)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "INITIAL_PURCHASE (Paid)" "$PAYLOAD"
    ;;

  renewal)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "RENEWAL",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "RENEWAL" "$PAYLOAD"
    ;;

  cancellation|cancel)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "CANCELLATION",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $SEVEN_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "CANCELLATION" "$PAYLOAD"
    ;;

  expiration|expire)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "EXPIRATION",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $NOW_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "EXPIRATION" "$PAYLOAD"
    ;;

  uncancellation|reactivate)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "UNCANCELLATION",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "UNCANCELLATION" "$PAYLOAD"
    ;;

  product_change|change)
    NEW_PRODUCT="${3:-co.smartspend.annual}"
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "PRODUCT_CHANGE",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$NEW_PRODUCT",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 19.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "PRODUCT_CHANGE" "$PAYLOAD"
    ;;

  billing_issue|billing)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "BILLING_ISSUE",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "BILLING_ISSUE" "$PAYLOAD"
    ;;

  test)
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "TEST",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "test",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": null,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 0,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "test"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "TEST" "$PAYLOAD"
    ;;

  full_flow)
    echo "============================================"
    echo "  FLUJO COMPLETO: Trial → Purchase → Cancel"
    echo "============================================"
    echo ""

    # Step 1: Initial purchase (trial)
    EVENT_ID="flow-1-$(date +%s)"
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $SEVEN_DAYS_MS,
    "period_type": "TRIAL",
    "currency": "USD",
    "price": 0,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "PASO 1: INITIAL_PURCHASE (Trial)" "$PAYLOAD"
    echo "Esperando 2 segundos..."
    sleep 2

    # Step 2: Renewal (trial → paid)
    EVENT_ID="flow-2-$(date +%s)"
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "RENEWAL",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "PASO 2: RENEWAL (Trial → Paid)" "$PAYLOAD"
    echo "Esperando 2 segundos..."
    sleep 2

    # Step 3: Cancellation
    EVENT_ID="flow-3-$(date +%s)"
    PAYLOAD=$(cat <<EOF
{
  "event": {
    "type": "CANCELLATION",
    "id": "$EVENT_ID",
    "app_user_id": "$USER_ID",
    "original_app_user_id": "$USER_ID",
    "app_id": "com.jhotech.smartspend",
    "event_timestamp_ms": $NOW_MS,
    "product_id": "$PRODUCT_ID",
    "entitlement_ids": ["pro"],
    "purchased_at_ms": $NOW_MS,
    "expiration_at_ms": $THIRTY_DAYS_MS,
    "period_type": "NORMAL",
    "currency": "USD",
    "price": 2.99,
    "store": "APP_STORE",
    "environment": "SANDBOX",
    "is_family_share": false,
    "country_code": "CO",
    "transaction_id": "txn-$EVENT_ID"
  },
  "api_version": "1.0"
}
EOF
    )
    send_webhook "PASO 3: CANCELLATION" "$PAYLOAD"

    echo ""
    echo "============================================"
    echo "  FLUJO COMPLETO TERMINADO"
    echo "============================================"
    echo ""
    echo "Verifica en Supabase:"
    echo "  SELECT * FROM user_subscriptions WHERE user_id = '$USER_ID';"
    echo "  SELECT event_type, event_id, created_at FROM revenuecat_events WHERE user_id = '$USER_ID' ORDER BY created_at;"
    echo ""
    ;;

  *)
    echo "Uso: $0 <evento> <user_id> [product_id]"
    echo ""
    echo "Eventos disponibles:"
    echo "  initial_purchase | trial   - Compra inicial (trial 7 días)"
    echo "  purchase                   - Compra inicial (pagada, sin trial)"
    echo "  renewal                    - Renovación"
    echo "  cancellation | cancel      - Cancelación"
    echo "  expiration | expire        - Expiración"
    echo "  uncancellation | reactivate - Reactivación"
    echo "  product_change | change    - Cambio de plan"
    echo "  billing_issue | billing    - Problema de pago"
    echo "  test                       - Evento de prueba"
    echo "  full_flow                  - Flujo completo: Trial → Paid → Cancel"
    echo ""
    echo "Ejemplos:"
    echo "  $0 test mi-user-id"
    echo "  $0 initial_purchase abc123-def456"
    echo "  $0 full_flow abc123-def456"
    echo "  $0 product_change abc123 co.smartspend.annual"
    echo ""
    echo "Variables de entorno:"
    echo "  SUPABASE_URL     - URL de tu proyecto Supabase"
    echo "  WEBHOOK_SECRET   - Secret configurado en la Edge Function"
    echo ""
    exit 1
    ;;
esac
