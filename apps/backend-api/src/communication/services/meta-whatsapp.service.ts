import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MetaSendResult {
  success: boolean;
  metaMessageId?: string;
  apiResponse?: Record<string, unknown>;
  errorMessage?: string;
  isRetryable: boolean;
  statusCode?: number;
  requestTime: Date;
  responseTime: Date;
}

export interface MetaConfigStatus {
  isConfigured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  apiVersion: string;
  hasAccessToken: boolean;
  hasVerifyToken: boolean;
}

@Injectable()
export class MetaWhatsappService {
  private readonly logger = new Logger(MetaWhatsappService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns current Meta configuration status (safely masks tokens).
   */
  getConfigStatus(): MetaConfigStatus {
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const businessAccountId = this.configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID');
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v21.0');

    return {
      isConfigured: Boolean(accessToken && phoneNumberId),
      phoneNumberId: phoneNumberId ? `${phoneNumberId.substring(0, 4)}...${phoneNumberId.slice(-4)}` : null,
      businessAccountId: businessAccountId ? `${businessAccountId.substring(0, 4)}...${businessAccountId.slice(-4)}` : null,
      apiVersion,
      hasAccessToken: Boolean(accessToken),
      hasVerifyToken: Boolean(verifyToken),
    };
  }

  /**
   * Normalizes raw phone numbers to E.164 format without leading '+' for Meta API.
   * e.g. "+1 (415) 523-8886" -> "14155238886"
   */
  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) {
      throw new Error(`Invalid phone number length (${cleaned.length} digits). E.164 expects 7-15 digits.`);
    }
    return cleaned;
  }

  /**
   * Send text message via Meta WhatsApp Cloud API.
   */
  async sendTextMessage(recipientPhone: string, textBody: string): Promise<MetaSendResult> {
    const requestTime = new Date();
    const token = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION', 'v21.0');

    if (!token || !phoneNumberId) {
      const responseTime = new Date();
      return {
        success: false,
        errorMessage: 'Meta WhatsApp credentials missing in env (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)',
        isRetryable: false,
        requestTime,
        responseTime,
      };
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = this.normalizePhoneNumber(recipientPhone);
    } catch (err: any) {
      const responseTime = new Date();
      return {
        success: false,
        errorMessage: `Phone validation failed: ${err.message}`,
        isRetryable: false,
        requestTime,
        responseTime,
      };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: textBody,
      },
    };

    try {
      this.logger.log(`[MetaWhatsappService] Dispatching message to ${normalizedPhone} via ${apiVersion}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseTime = new Date();
      const statusCode = res.status;
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const isRetryable = statusCode === 429 || statusCode >= 500;
        const errorDetails = (data as any)?.error?.message || `HTTP ${statusCode}`;
        this.logger.warn(`[MetaWhatsappService] Meta API error (status ${statusCode}, retryable: ${isRetryable}): ${errorDetails}`);

        return {
          success: false,
          statusCode,
          errorMessage: `Meta API Error (${statusCode}): ${errorDetails}`,
          apiResponse: data as Record<string, unknown>,
          isRetryable,
          requestTime,
          responseTime,
        };
      }

      const metaMessageId = (data as any)?.messages?.[0]?.id;
      this.logger.log(`[MetaWhatsappService] Message sent successfully! wamid: ${metaMessageId}`);

      return {
        success: true,
        statusCode,
        metaMessageId,
        apiResponse: data as Record<string, unknown>,
        isRetryable: false,
        requestTime,
        responseTime,
      };
    } catch (err: any) {
      const responseTime = new Date();
      this.logger.error(`[MetaWhatsappService] Network/Fetch error: ${err.message}`);
      return {
        success: false,
        errorMessage: `Network error: ${err.message}`,
        isRetryable: true, // Network failures are retryable
        requestTime,
        responseTime,
      };
    }
  }
}
