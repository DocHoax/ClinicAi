import * as mockApi from './mockApi'

const n8nChatWebhookUrl = typeof import.meta !== 'undefined'
    ? ((import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim())
    : ''

function normalizeWebhookResult(raw) {
    const data = Array.isArray(raw) ? raw[0] : raw

    const text =
        data?.response ||
        data?.text ||
        data?.answer ||
        data?.message ||
        data?.data?.response ||
        data?.data?.text ||
        data?.data?.answer ||
        data?.data?.message

    if (typeof text === 'string' && text.trim()) {
        return { success: data?.success ?? true, response: text, timestamp: data?.timestamp }
    }

    if (typeof data === 'string' && data.trim()) {
        return { success: true, response: data }
    }

    return { success: data?.success ?? true, response: 'Sorry — I could not generate a response.' }
}

async function postWebhookJson(payload, { signal } = {}) {
    const response = await fetch(n8nChatWebhookUrl, {
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

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
        return response.json()
    }

    const text = await response.text().catch(() => '')
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

export async function sendYarnGPTMessage({ message, preferredLanguage, conversation, clinicId = 'demo', signal } = {}) {
    const trimmed = typeof message === 'string' ? message.trim() : ''
    if (!trimmed) {
        return { success: false, response: 'Please enter a message.' }
    }

    if (n8nChatWebhookUrl) {
        const raw = await postWebhookJson(
            {
                endpoint: 'chat',
                agent: 'YarnGPT',
                clinicId,
                preferredLanguage,
                message: trimmed,
                conversation
            },
            { signal }
        )

        const normalized = normalizeWebhookResult(raw)
        if (normalized?.success === false) {
            throw new Error(normalized?.message || 'Chat request failed')
        }
        return normalized
    }

    // Fallback (demo mode)
    return mockApi.sendChatMessage(trimmed, clinicId, { preferredLanguage })
}
