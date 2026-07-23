import { Worker, Job } from 'bullmq';

export function createOutgoingMessagesWorker(redisConnection: any) {
  console.info('[OutgoingWorker] Starting outgoing messages worker...');

  const worker = new Worker(
    'outgoing_messages',
    async (job: Job) => {
      console.info(`[OutgoingWorker] Processing job ${job.id} of type ${job.name}`);
      console.info('[OutgoingWorker] Outbound Message Details:', JSON.stringify(job.data, null, 2));

      const { to, content } = job.data;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const isPlaceholder = (val?: string) =>
        !val || val.startsWith('your_') || val.startsWith('your-') || val.includes('placeholder');
      const simulate =
        process.env.WHATSAPP_SIMULATE === 'true' ||
        (process.env.NODE_ENV !== 'production' &&
          (!accessToken ||
            !phoneNumberId ||
            isPlaceholder(accessToken) ||
            isPlaceholder(phoneNumberId)));

      if (!simulate) {
        if (!accessToken || !phoneNumberId) {
          throw new Error(
            'Meta WhatsApp Business API credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are missing',
          );
        }

        console.info(
          `[OutgoingWorker] Dispatching real message via Meta WhatsApp Graph API to: ${to}`,
        );

        try {
          const response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: {
                  preview_url: false,
                  body: content,
                },
              }),
            },
          );

          const responseData = await response.json();

          if (!response.ok) {
            console.error(
              `[OutgoingWorker] Meta API error: Status ${response.status}`,
              JSON.stringify(responseData),
            );
            throw new Error(
              `Meta API error: ${responseData?.error?.message || response.statusText}`,
            );
          }

          console.info(
            `[OutgoingWorker] Message successfully sent via Meta. Meta message ID: ${responseData?.messages?.[0]?.id}`,
          );
          return {
            success: true,
            sentAt: new Date().toISOString(),
            metaMessageId: responseData?.messages?.[0]?.id,
          };
        } catch (error) {
          console.error('[OutgoingWorker] Exception during Meta dispatch:', error);
          throw error;
        }
      } else {
        console.info(`[OutgoingWorker] (SIMULATED) Outbound message successfully "sent" to: ${to}`);
        console.info(`[OutgoingWorker] (SIMULATED) Body: "${content}"`);
        return { success: true, sentAt: new Date().toISOString(), simulated: true };
      }
    },
    {
      connection: redisConnection,
    },
  );

  worker.on('completed', (job) => {
    console.info(`[OutgoingWorker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[OutgoingWorker] Job ${job?.id} failed with error:`, err);
  });

  return worker;
}
