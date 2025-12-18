import * as mockApi from './mockApi'

const apiBaseUrl = typeof import.meta !== 'undefined'
    ? (import.meta.env.VITE_API_BASE_URL || '').trim()
    : ''

const n8nWebhookUrl = typeof import.meta !== 'undefined'
    ? (import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim()
    : ''

async function fetchJson(path, { signal } = {}) {
    const url = `${apiBaseUrl}${path}`
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        },
        signal
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Request failed (${response.status}): ${text || response.statusText}`)
    }

    return response.json()
}

async function postWebhookJson(payload, { signal } = {}) {
    const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`Webhook failed (${response.status}): ${text || response.statusText}`)
    }

    // Some n8n workflows return plain text; try json first.
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        return response.json()
    }

    const text = await response.text().catch(() => '')
    try {
        return JSON.parse(text)
    } catch {
        return { success: true, data: text }
    }
}

function normalizeStatsResponse(data) {
    if (!data) return { success: true, stats: {} }
    if (data.stats) return data

    const maybe = {
        todayAppointments: data.todayAppointments,
        pendingInquiries: data.pendingInquiries,
        activePatients: data.activePatients,
        aiInteractions: data.aiInteractions,
        updatedAt: data.updatedAt
    }

    // If the workflow returned the stats under a nested key.
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return normalizeStatsResponse(data.data)
    }

    return { success: data.success ?? true, stats: maybe }
}

function normalizeAppointmentsResponse(data) {
    if (!data) return { success: true, appointments: [] }
    if (Array.isArray(data.appointments)) return data
    if (Array.isArray(data.data)) return { success: data.success ?? true, appointments: data.data }
    if (data.data && Array.isArray(data.data.appointments)) {
        return { success: data.success ?? true, appointments: data.data.appointments }
    }
    return { success: data.success ?? true, appointments: [] }
}

function normalizeActivityResponse(data) {
    if (!data) return { success: true, activity: [] }
    if (Array.isArray(data.activity)) return data
    if (Array.isArray(data.data)) return { success: data.success ?? true, activity: data.data }
    if (data.data && Array.isArray(data.data.activity)) {
        return { success: data.success ?? true, activity: data.data.activity }
    }
    return { success: data.success ?? true, activity: [] }
}

export async function getDashboardStats({ signal } = {}) {
    if (n8nWebhookUrl) {
        const data = await postWebhookJson({ endpoint: 'dashboard/stats' }, { signal })
        const normalized = normalizeStatsResponse(data)
        if (normalized?.success === false) {
            throw new Error(normalized?.message || 'Failed to load dashboard stats')
        }
        return normalized
    }

    if (apiBaseUrl) {
        const data = await fetchJson('/dashboard/stats', { signal })
        if (data?.success === false) {
            throw new Error(data?.message || 'Failed to load dashboard stats')
        }
        return data
    }

    return mockApi.getDashboardStats()
}

export async function getTodayAppointments({ signal } = {}) {
    if (n8nWebhookUrl) {
        const data = await postWebhookJson({ endpoint: 'appointments/today' }, { signal })
        const normalized = normalizeAppointmentsResponse(data)
        if (normalized?.success === false) {
            throw new Error(normalized?.message || 'Failed to load today\'s appointments')
        }
        return normalized
    }

    if (apiBaseUrl) {
        const data = await fetchJson('/appointments/today', { signal })
        if (data?.success === false) {
            throw new Error(data?.message || 'Failed to load today\'s appointments')
        }
        return data
    }

    return mockApi.getTodayAppointments()
}

export async function getRecentActivity({ signal } = {}) {
    if (n8nWebhookUrl) {
        const data = await postWebhookJson({ endpoint: 'dashboard/activity' }, { signal })
        const normalized = normalizeActivityResponse(data)
        if (normalized?.success === false) {
            throw new Error(normalized?.message || 'Failed to load recent activity')
        }
        return normalized
    }

    if (apiBaseUrl) {
        const data = await fetchJson('/dashboard/activity', { signal })
        if (data?.success === false) {
            throw new Error(data?.message || 'Failed to load recent activity')
        }
        return data
    }

    return mockApi.getRecentActivity()
}
