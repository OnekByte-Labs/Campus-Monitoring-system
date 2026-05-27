import 'dotenv/config'; // Must be the absolute first line
import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase via REST API
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERROR] Missing Supabase credentials in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Connect to the Broker (Fallback to HiveMQ if env var is missing)
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
const client = mqtt.connect(BROKER_URL);

// --- MQTT Event Handlers ---
client.on('connect', () => {
  console.log(`✅ Node.js Backend connected to MQTT Broker at ${BROKER_URL}`);
  
  // Subscribe to all gate attendance topics
  const topic = 'campus/gates/+/attendance';
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Failed to subscribe to ${topic}:`, err);
    } else {
      console.log(`📡 Subscribed to topic: ${topic} (QoS 1)`);
    }
  });
});

client.on('error', (err) => {
  console.error('❌ MQTT Connection Error:', err);
});

client.on('reconnect', () => {
  console.log('🔄 Attempting to reconnect to broker...');
});

client.on('offline', () => {
  console.log('🔌 Broker is unreachable (Offline).');
});

// --- Message Processing ---
client.on('message', async (topic, message) => {
  try {
    const eventData = JSON.parse(message.toString());
    console.log(`\n📥 Received event from [${topic}]:`, eventData);

    const { student_id, timestamp, similarity_score } = eventData;

    // Validate payload fields
    if (!student_id || !timestamp || similarity_score === undefined) {
      throw new Error('Invalid payload: missing required fields');
    }

    // Insert into Supabase using the REST SDK
    const { error } = await supabase
      .from('attendance_logs')
      .insert([
        {
          student_id: student_id,
          // Convert Unix timestamp (seconds) to an ISO date string
          timestamp: new Date(timestamp * 1000).toISOString(),
          similarity_score: similarity_score
        }
      ]);

    if (error) {
      console.error('❌ Supabase Insert Error:', error.message);
    } else {
      console.log(`✅ Successfully logged attendance for ${student_id} to Supabase`);
    }

  } catch (error) {
    console.error('⚠️ Error processing MQTT message:', error.message);
  }
});