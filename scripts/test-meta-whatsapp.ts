import fetch from 'node-fetch';

async function testMetaWhatsApp() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1207753202424292';
  const recipientPhone = '918073536845'; // Stripped leading +

  console.log(`[Meta Test] Sending to: ${recipientPhone} using Phone Number ID: ${phoneNumberId}`);

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: { preview_url: false, body: 'Hello from Axiom! This is your project reminder test message.' },
      }),
    },
  );

  const data = await response.json();
  console.log('Response Status:', response.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));
}

testMetaWhatsApp();
