/**
 * Firebase Cloud Messaging (FCM) Client
 *
 * Sends push notifications via FCM HTTP v1 API using Service Account authentication.
 */

import { JWT } from 'https://deno.land/x/google_auth@v0.1.0/mod.ts';

// FCM endpoint — project ID from service account
const FCM_ENDPOINT =
  `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id || 'MISSING_PROJECT_ID'}/messages:send`;

// Service account credentials from environment
const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');

interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    priority?: 'high' | 'normal';
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
      channel_id?: string;
    };
  };
  apns?: {
    payload?: {
      aps?: {
        sound?: string;
        badge?: number;
        'content-available'?: number;
      };
    };
  };
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get OAuth2 access token for FCM
 */
async function getAccessToken(): Promise<string> {
  const jwt = new JWT({
    email: SERVICE_ACCOUNT.client_email,
    key: SERVICE_ACCOUNT.private_key,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  const token = await jwt.getToken();
  return token.access_token;
}

/**
 * Send a push notification via FCM
 */
export async function sendNotification(message: FCMMessage): Promise<FCMResponse> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: message.token,
          notification: message.notification,
          data: message.data,
          android: message.android || {
            priority: 'high',
            notification: {
              icon: 'ic_notification',
              color: '#18B7B0',
              sound: 'default',
              channel_id: 'app_notifications',
            },
          },
          apns: message.apns || {
            payload: {
              aps: {
                sound: 'default',
              },
            },
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data.name,
      };
    }

    const error = await response.json();
    console.error('[FCM] Error sending notification:', error);

    // Handle invalid token
    if (
      error.error?.details?.some(
        (d: { errorCode: string }) =>
          d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT'
      )
    ) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
      };
    }

    return {
      success: false,
      error: error.error?.message || 'Unknown error',
    };
  } catch (error) {
    console.error('[FCM] Exception sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notifications to multiple tokens
 */
export async function sendToMultipleTokens(
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>
): Promise<{ success: string[]; failed: string[] }> {
  const results = await Promise.all(
    tokens.map(async (token) => {
      const result = await sendNotification({
        token,
        notification,
        data,
      });
      return { token, ...result };
    })
  );

  return {
    success: results.filter((r) => r.success).map((r) => r.token),
    failed: results.filter((r) => !r.success).map((r) => r.token),
  };
}
