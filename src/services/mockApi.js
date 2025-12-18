/**
 * Mock API Service for ClinicAI Demo
 * 
 * This simulates the n8n backend endpoints.
 * Replace these with actual API calls when your friend's
 * n8n workflows are ready.
 */

// Simulated delay to mimic network requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Mock clinic data storage (in a real app, this would come from n8n/Firebase/Supabase)
let clinicData = null

// Dashboard state (mutable so polling appears real-time in demo mode)
let dashboardState = {
    todayAppointments: 12,
    pendingInquiries: 5,
    activePatients: 248,
    aiInteractions: 89,
    updatedAt: Date.now()
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function tickDashboardState() {
    const now = Date.now()
    const elapsed = now - dashboardState.updatedAt

    // Only mutate if at least 2s passed to avoid rapid changes on fast refresh.
    if (elapsed < 2000) {
        return
    }

    const randomStep = () => (Math.random() < 0.5 ? -1 : 1)
    dashboardState = {
        ...dashboardState,
        todayAppointments: clamp(dashboardState.todayAppointments + (Math.random() < 0.35 ? randomStep() : 0), 0, 60),
        pendingInquiries: clamp(dashboardState.pendingInquiries + (Math.random() < 0.4 ? randomStep() : 0), 0, 30),
        activePatients: clamp(dashboardState.activePatients + (Math.random() < 0.25 ? randomStep() : 0), 0, 5000),
        aiInteractions: clamp(dashboardState.aiInteractions + (Math.random() < 0.6 ? randomStep() : 0), 0, 500),
        updatedAt: now
    }
}

/**
 * Register a new clinic
 * n8n endpoint: POST /webhook/clinic/register
 */
export async function registerClinic(data) {
    await delay(1000) // Simulate network delay

    clinicData = {
        ...data,
        id: 'clinic_' + Date.now(),
        createdAt: new Date().toISOString(),
        aiAssistantId: 'assistant_' + Date.now()
    }

    console.log('📋 Clinic registered:', clinicData)

    return {
        success: true,
        clinic: clinicData,
        message: 'Clinic registered successfully'
    }
}

/**
 * Send a chat message to the AI assistant
 * n8n endpoint: POST /webhook/chat
 */
export async function sendChatMessage(message, clinicId = 'demo') {
    let options = {}
    let resolvedClinicId = clinicId

    // Backward/forward compatible signature:
    // sendChatMessage(message, clinicId)
    // sendChatMessage(message, clinicId, { preferredLanguage })
    // sendChatMessage(message, { preferredLanguage })
    if (clinicId && typeof clinicId === 'object' && !Array.isArray(clinicId)) {
        options = clinicId
        resolvedClinicId = 'demo'
    }

    if (arguments.length >= 3 && typeof arguments[2] === 'object' && arguments[2] !== null) {
        options = arguments[2]
    }

    await delay(800)

    // In production, this would hit YarnGPT via n8n
    const response = generateMockAIResponse(message, options?.preferredLanguage)

    return {
        success: true,
        response: response,
        timestamp: new Date().toISOString(),
        clinicId: resolvedClinicId
    }
}

/**
 * Get available appointment slots
 * n8n endpoint: GET /webhook/appointments/available
 */
export async function getAvailableSlots(date = null) {
    await delay(500)

    const slots = [
        { id: 1, date: 'Tomorrow', time: '10:00 AM', available: true },
        { id: 2, date: 'Tomorrow', time: '2:30 PM', available: true },
        { id: 3, date: 'Tomorrow', time: '4:00 PM', available: true },
        { id: 4, date: 'Saturday', time: '9:00 AM', available: true },
        { id: 5, date: 'Saturday', time: '11:30 AM', available: true },
    ]

    return {
        success: true,
        slots: slots
    }
}

/**
 * Book an appointment
 * n8n endpoint: POST /webhook/appointments/book
 */
export async function bookAppointment(slotId, patientInfo) {
    await delay(1000)

    return {
        success: true,
        appointment: {
            id: 'apt_' + Date.now(),
            slotId: slotId,
            patient: patientInfo,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        },
        message: 'Appointment booked successfully'
    }
}

/**
 * Get dashboard stats
 * n8n endpoint: GET /webhook/dashboard/stats
 */
export async function getDashboardStats() {
    await delay(300)

    tickDashboardState()

    return {
        success: true,
        stats: {
            todayAppointments: dashboardState.todayAppointments,
            pendingInquiries: dashboardState.pendingInquiries,
            activePatients: dashboardState.activePatients,
            aiInteractions: dashboardState.aiInteractions,
            updatedAt: new Date(dashboardState.updatedAt).toISOString()
        }
    }
}

/**
 * Get recent activity
 * n8n endpoint: GET /webhook/dashboard/activity
 */
export async function getRecentActivity() {
    await delay(250)

    const now = Date.now()
    const items = [
        { message: 'New appointment booked by AI assistant', timeMs: now - 5 * 60 * 1000, type: 'success' },
        { message: 'Patient inquiry escalated to staff', timeMs: now - 15 * 60 * 1000, type: 'warning' },
        { message: 'Follow-up reminder sent to patients', timeMs: now - 60 * 60 * 1000, type: 'info' },
        { message: 'New patient registered via chat', timeMs: now - 2 * 60 * 60 * 1000, type: 'success' }
    ]

    return {
        success: true,
        activity: items.map((item, index) => ({
            id: `activity_${now}_${index}`,
            message: item.message,
            type: item.type,
            timestamp: new Date(item.timeMs).toISOString()
        }))
    }
}

/**
 * Get today's appointments
 * n8n endpoint: GET /webhook/appointments/today
 */
export async function getTodayAppointments() {
    await delay(400)

    return {
        success: true,
        appointments: [
            { id: 1, patient: 'Sarah Johnson', time: '9:00 AM', type: 'General Checkup', status: 'Confirmed' },
            { id: 2, patient: 'Michael Chen', time: '10:30 AM', type: 'Follow-up', status: 'Confirmed' },
            { id: 3, patient: 'Emily Davis', time: '11:00 AM', type: 'Consultation', status: 'Pending' },
            { id: 4, patient: 'James Wilson', time: '2:00 PM', type: 'Lab Results', status: 'Confirmed' },
            { id: 5, patient: 'Maria Garcia', time: '3:30 PM', type: 'Vaccination', status: 'Confirmed' },
        ]
    }
}

// Helper function to generate mock AI responses
function normalizeLanguageTag(tag) {
    if (typeof tag !== 'string') return 'en'
    const trimmed = tag.trim()
    if (!trimmed) return 'en'
    return trimmed.toLowerCase()
}

function pickLanguage(tag) {
    const normalized = normalizeLanguageTag(tag)
    // Keep it simple: prefer primary language subtag.
    return normalized.split('-')[0]
}

function generateMockAIResponse(message, preferredLanguage) {
    const lang = pickLanguage(preferredLanguage)
    const lowerMessage = message.toLowerCase()

    const t = (en, es, fr, ar) => {
        if (lang === 'es') return es || en
        if (lang === 'fr') return fr || en
        if (lang === 'ar') return ar || en
        return en
    }

    if (lowerMessage.includes('symptom')) {
        return t(
            "I can help guide you through a symptom assessment. Please tell me what symptoms you're experiencing, how long you've had them, and rate any pain from 1-10.",
            'Puedo guiarte en una evaluación de síntomas. Dime qué síntomas tienes, desde cuándo y califica cualquier dolor del 1 al 10.',
            'Je peux vous guider dans une évaluation des symptômes. Dites-moi quels symptômes vous ressentez, depuis quand, et notez la douleur de 1 à 10.',
            'يمكنني مساعدتك في تقييم الأعراض. أخبرني ما الأعراض التي تشعر بها، منذ متى، وقيّم أي ألم من 1 إلى 10.'
        )
    }

    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
        return t(
            "I can help you book an appointment! Our next available slots are tomorrow at 10:00 AM, 2:30 PM, or 4:00 PM. Which works best for you?",
            '¡Puedo ayudarte a reservar una cita! Los próximos horarios disponibles son mañana a las 10:00, 14:30 o 16:00. ¿Cuál te queda mejor?',
            'Je peux vous aider à prendre rendez-vous ! Les prochains créneaux sont demain à 10:00, 14:30 ou 16:00. Lequel vous convient ?',
            'يمكنني مساعدتك في حجز موعد! المواعيد المتاحة غداً: 10:00 صباحاً، 2:30 مساءً، أو 4:00 مساءً. أي وقت يناسبك؟'
        )
    }

    if (lowerMessage.includes('hour')) {
        return t(
            'Our clinic is open Monday-Friday 8:00 AM - 6:00 PM, Saturday 9:00 AM - 1:00 PM, and closed on Sunday.',
            'Nuestro horario es: lunes a viernes 8:00–18:00, sábado 9:00–13:00 y domingo cerrado.',
            'Horaires : lundi-vendredi 8h–18h, samedi 9h–13h, fermé le dimanche.',
            'ساعات العمل: من الإثنين إلى الجمعة 8:00 ص–6:00 م، السبت 9:00 ص–1:00 م، مغلق يوم الأحد.'
        )
    }

    return t(
        "I'm YarnGPT — here to help with symptom guidance, appointment booking, and general clinic questions. How can I assist you today?",
        'Soy YarnGPT — puedo ayudar con orientación sobre síntomas, reservas de citas y preguntas generales. ¿En qué puedo ayudarte hoy?',
        "Je suis YarnGPT — je peux aider pour les symptômes, les rendez-vous et les questions générales. Comment puis-je vous aider ?",
        'أنا YarnGPT — هنا للمساعدة في إرشاد الأعراض وحجز المواعيد والأسئلة العامة. كيف أساعدك اليوم؟'
    )
}

export default {
    registerClinic,
    sendChatMessage,
    getAvailableSlots,
    bookAppointment,
    getDashboardStats,
    getTodayAppointments,
    getRecentActivity
}
