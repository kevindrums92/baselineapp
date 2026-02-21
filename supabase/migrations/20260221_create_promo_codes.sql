-- ============================================================
-- Promo Codes System
-- Allows generating promotional codes that grant lifetime Pro
-- ============================================================

-- Tabla de codigos promocionales
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_redemptions INT NOT NULL DEFAULT 1,
  current_redemptions INT NOT NULL DEFAULT 0,
  product_id TEXT NOT NULL DEFAULT 'co.baselineapp.lifetime',
  expires_at TIMESTAMPTZ,
  created_by TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de redenciones (audit trail)
CREATE TABLE promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- Indice para busqueda case-insensitive por codigo
CREATE INDEX idx_promo_codes_upper_code ON promo_codes (UPPER(code));

-- Indice para buscar redenciones por usuario
CREATE INDEX idx_promo_redemptions_user ON promo_redemptions (user_id);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede leer/escribir promo_codes (Edge Functions + admin)
-- No se crean policies para usuarios normales: la Edge Function usa service_role

-- Los usuarios autenticados pueden leer sus propias redenciones
CREATE POLICY "Users can read own redemptions"
  ON promo_redemptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
