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

    // Extract student_name along with the other fields
    const { student_id, student_name, timestamp, similarity_score } = eventData;

    // Validate payload fields (student_name is optional here to prevent crashes if old payloads arrive)
    if (!student_id || !timestamp || similarity_score === undefined) {
      throw new Error('Invalid payload: missing required fields');
    }

    const displayName = student_name || "Unknown Student";
    console.log(`\n📥 Received event from [${topic}]: ${displayName} (${student_id})`);

    // Insert into Supabase using the REST SDK
    const { error } = await supabase
      .from('attendance_logs')
      .insert([
        {
          student_id: student_id,
          student_name: student_name, // Make sure this column exists in your Supabase table!
          // Convert Unix timestamp (seconds) to an ISO date string
          timestamp: new Date(timestamp * 1000).toISOString(),
          similarity_score: similarity_score
        }
      ]);

    if (error) {
      console.error(`❌ Supabase Insert Error for ${displayName}:`, error.message);
    } else {
      console.log(`==================================================`);
      console.log(`✅ Attendance permanently logged for: ${displayName}`);
      console.log(`==================================================`);
    }

  } catch (error) {
    console.error('⚠️ Error processing MQTT message:', error.message);
  }
});