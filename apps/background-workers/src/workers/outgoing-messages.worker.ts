import { Worker, Job } from 'bullmq';
import twilio from 'twilio';

export function createOutgoingMessagesWorker(redisConnection: any) {
  console.info('[OutgoingWorker] Starting outgoing messages worker...');

  const worker = new Worker(
    'outgoing_messages',
    async (job: Job) => {
      console.info(`[OutgoingWorker] Processing job ${job.id} of type ${job.name}`);

      const { to, content } = job.data as { to: string; content: string };

      // ----------------------------------------------------------------
      // Twilio WhatsApp Sandbox (primary for testing)
      // ----------------------------------------------------------------
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

      const hasTwilio =
        twilioSid &&
        twilioToken &&
        !twilioSid.startsWith('your_') &&
        !twilioToken.startsWith('your_');

      // ----------------------------------------------------------------
      // Meta WhatsApp Business API (future production path)
      // ----------------------------------------------------------------
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const isPlaceholderMeta = (val?: string) =>
        !val || val.startsWith('your_') || val.startsWith('your-') || val.includes('placeholder');

      const hasMeta =
        accessToken &&
        phoneNumberId &&
        !isPlaceholderMeta(accessToken) &&
        !isPlaceholderMeta(phoneNumberId);

      const simulate = process.env.WHATSAPP_SIMULATE === 'true';

      // ----------------------------------------------------------------
      // Routing logic
      // ----------------------------------------------------------------
      if (simulate) {
        console.info(`[OutgoingWorker] (SIMULATED) Message to: ${to}`);
        console.info(`[OutgoingWorker] (SIMULATED) Body: "${content}"`);
        return { success: true, sentAt: new Date().toISOString(), simulated: true };
      }

      if (hasTwilio) {
        // Ensure 'to' has the whatsapp: prefix
        const twilioTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        console.info(`[OutgoingWorker] Dispatching message via Twilio to: ${twilioTo}`);

        try {
          const client = twilio(twilioSid!, twilioToken!);
          const message = await client.messages.create({
            from: twilioFrom,
            to: twilioTo,
            body: content,
          });

          console.info(
            `[OutgoingWorker] Message sent via Twilio. SID: ${message.sid} | Status: ${message.status}`,
          );
          return {
            success: true,
            sentAt: new Date().toISOString(),
            provider: 'twilio',
            messageSid: message.sid,
          };
        } catch (error) {
          console.error('[OutgoingWorker] Twilio dispatch error:', error);
          throw error;
        }
      }

      if (hasMeta) {
        const normalizedPhone = to.replace(/[^\d]/g, '');
        const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
        console.info(
          `[OutgoingWorker] Dispatching message via Meta WhatsApp Graph API (${apiVersion}) to: ${normalizedPhone}`,
        );
        try {
          const response = await fetch(
            `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: normalizedPhone,
                type: 'text',
                text: { preview_url: false, body: content },
              }),
            },
          );

          const responseData = (await response.json()) as any;
          if (!response.ok) {
            const errCode = responseData?.error?.code;
            const errMsg = responseData?.error?.message || response.statusText;
            console.error(
              `[OutgoingWorker] Meta API Error (Code ${errCode}): ${errMsg}`,
            );
            if (errCode === 190) {
              console.warn(
                '[OutgoingWorker] WHATSAPP_ACCESS_TOKEN in .env has expired. Please refresh your token from Meta Developer Portal.',
              );
            }
            throw new Error(`Meta API error (${errCode}): ${errMsg}`);
          }

          console.info(
            `[OutgoingWorker] Message sent via Meta. ID: ${responseData?.messages?.[0]?.id}`,
          );
          return {
            success: true,
            sentAt: new Date().toISOString(),
            provider: 'meta',
            metaMessageId: responseData?.messages?.[0]?.id,
          };
        } catch (error) {
          console.error('[OutgoingWorker] Meta dispatch error:', error);
          throw error;
        }
      }

      // No real credentials configured — log a clear warning
      console.warn(
        '[OutgoingWorker] No WhatsApp credentials found. Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN ' +
          'or WHATSAPP_SIMULATE=true in .env',
      );
      console.info(`[OutgoingWorker] (FALLBACK LOG) To: ${to} | Body: "${content}"`);
      return { success: false, reason: 'no_credentials' };
    },
    {
      connection: redisConnection,
    },
  );

  worker.on('completed', (job) => {
    console.info(`[OutgoingWorker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[OutgoingWorker] Job ${job?.id} failed:`, err.message || err);
  });

  return worker;
}
