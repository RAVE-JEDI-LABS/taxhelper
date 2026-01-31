import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const BACKEND_URL = 'https://taxhelper-backend-10869513938.us-central1.run.app';

async function main() {
  try {
    const numbers = await client.incomingPhoneNumbers.list({
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    });

    if (numbers.length === 0) {
      console.log('Phone number not found');
      return;
    }

    const phone = numbers[0];
    console.log('=== Current Config ===');
    console.log('Phone:', phone.phoneNumber);
    console.log('Voice URL:', phone.voiceUrl || 'NOT SET');
    console.log('Voice Method:', phone.voiceMethod);
    console.log('SMS URL:', phone.smsUrl || 'NOT SET');
    console.log('SMS Method:', phone.smsMethod);

    // Update webhooks if not set correctly
    const expectedVoiceUrl = `${BACKEND_URL}/api/twilio/incoming`;
    const expectedSmsUrl = `${BACKEND_URL}/api/twilio/sms`;

    if (phone.voiceUrl !== expectedVoiceUrl || phone.smsUrl !== expectedSmsUrl) {
      console.log('\n=== Updating Webhooks ===');
      const updated = await client.incomingPhoneNumbers(phone.sid).update({
        voiceUrl: expectedVoiceUrl,
        voiceMethod: 'POST',
        smsUrl: expectedSmsUrl,
        smsMethod: 'POST',
        statusCallback: `${BACKEND_URL}/api/twilio/status`,
        statusCallbackMethod: 'POST',
      });
      console.log('Updated Voice URL:', updated.voiceUrl);
      console.log('Updated SMS URL:', updated.smsUrl);
      console.log('Webhooks configured!');
    } else {
      console.log('\nWebhooks already configured correctly.');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

main();
