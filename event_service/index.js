require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express App
const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// CAMERA MAPPING CONFIGURATION
// Maps camera_id to logical zones and event types
// ==========================================
const CAMERA_MAP = {
    'cam_main_gate_in': { zone: 'Main Gate', type: 'IN' },
    'cam_main_gate_out': { zone: 'Main Gate', type: 'OUT' },
    'cam_library_1': { zone: 'Library', type: 'MOVEMENT' },
    'cam_mock_1': { zone: 'Mock Entrance', type: 'IN' },
    'cam_mock_2': { zone: 'Mock Exit', type: 'OUT' },
    'cam_mock_3': { zone: 'Mock Hallway', type: 'MOVEMENT' },
    'cam_mock_4': { zone: 'Mock Hallway', type: 'MOVEMENT' }
};

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const requireApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.SERVICE_API_KEY) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Invalid or missing x-api-key header'
        });
    }
    next();
};

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Event Service is running' });
});

/**
 * POST /api/events/attendance
 * Receives raw detection events from edge devices.
 */
app.post('/api/events/attendance', requireApiKey, async (req, res) => {
    try {
        const { student_id, camera_id, timestamp, confidence_score } = req.body;

        // Basic validation
        if (!student_id || !camera_id || !timestamp || !confidence_score) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: student_id, camera_id, timestamp, confidence_score'
            });
        }

        // B. Determine Event Type & Zone
        const cameraConfig = CAMERA_MAP[camera_id];
        if (!cameraConfig) {
            return res.status(400).json({
                status: 'error',
                message: `Unknown camera_id: ${camera_id}. Please update CAMERA_MAP.`
            });
        }

        const { type: eventType, zone } = cameraConfig;
        const incomingDate = new Date(timestamp);

        // A. Deduplication Check (3 minutes)
        const { data: lastEvent, error: fetchError } = await supabase
            .from('student_paths')
            .select('timestamp')
            .eq('student_id', student_id)
            .eq('camera_id', camera_id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 is "Rows not found", which is perfectly fine here
            console.error('Supabase Fetch Error:', fetchError);
            throw fetchError;
        }

        if (lastEvent) {
            const lastEventDate = new Date(lastEvent.timestamp);
            const timeDiffMinutes = (incomingDate - lastEventDate) / (1000 * 60);

            if (timeDiffMinutes < 3) {
                console.log(`[DEBOUNCE] Skipped event for ${student_id} at ${camera_id} (last seen ${timeDiffMinutes.toFixed(2)} mins ago)`);
                return res.status(200).json({
                    status: 'success',
                    action: 'event_debounced',
                    message: 'Event debounced due to 3-minute cooldown'
                });
            }
        }

        // C. Log the Path
        const pathPayload = {
            student_id,
            camera_id,
            zone,
            event_type: eventType,
            confidence_score,
            timestamp: incomingDate.toISOString()
        };

        const { error: insertError } = await supabase
            .from('student_paths')
            .insert([pathPayload]);

        if (insertError) throw insertError;

        console.log(`[PATH LOGGED] ${student_id} -> ${zone} (${eventType})`);

        // D. Update Status (Only if IN or OUT)
        if (eventType === 'IN' || eventType === 'OUT') {
            const isInside = eventType === 'IN';
            
            const statusPayload = {
                student_id,
                current_zone: isInside ? zone : 'Off Campus',
                is_inside: isInside,
                last_seen: incomingDate.toISOString()
            };

            // Assuming student_id is the primary key or unique constraint in student_status
            const { error: upsertError } = await supabase
                .from('student_status')
                .upsert(statusPayload, { onConflict: 'student_id' });

            if (upsertError) throw upsertError;
            
            console.log(`[STATUS UPDATED] ${student_id} is now ${isInside ? 'IN' : 'OUT'}`);
            
            return res.status(200).json({
                status: 'success',
                action: 'path_logged_and_status_updated',
                data: { pathPayload, statusPayload }
            });
        }

        // Return standard response for MOVEMENT events
        return res.status(200).json({
            status: 'success',
            action: 'path_logged',
            data: { pathPayload }
        });

    } catch (error) {
        console.error('[API ERROR]', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            details: error.message
        });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Event Service running on port ${PORT}`);
    console.log(`🔒 API Key protection: ENABLED`);
    console.log(`=================================`);
});
