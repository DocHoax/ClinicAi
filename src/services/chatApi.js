import * as mockApi from './mockApi'

function getChatWebhookUrl() {
    if (typeof import.meta === 'undefined') {
        return ''
    }

    const url = String(import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || import.meta.env.VITE_N8N_WEBHOOK_URL || '').trim()
    return url
}

function normalizeMaybeString(value) {
    if (typeof value !== 'string') return ''
    const trimmed = value.trim()
    return trimmed
}

function pickFirstTextCandidate(obj) {
    // Common shapes returned from n8n Respond-to-Webhook or LLM wrappers.
    const candidates = [
        obj?.response,
        obj?.text,
        obj?.answer,
        obj?.output,
        obj?.result,
        obj?.content,

        obj?.data?.response,
        obj?.data?.text,
        obj?.data?.answer,
        obj?.data?.output,
        obj?.data?.result,
        obj?.data?.content,

        // OpenAI-ish shapes
        obj?.choices?.[0]?.message?.content,
        obj?.choices?.[0]?.text,
        obj?.data?.choices?.[0]?.message?.content,
        obj?.data?.choices?.[0]?.text,

        // Some n8n patterns
        obj?.body?.response,
        obj?.body?.text,
        obj?.body?.answer,
        obj?.body?.output,
        obj?.body?.result,
        obj?.body?.content,
        obj?.body?.data?.response,
        obj?.body?.data?.text,
        obj?.body?.data?.answer,
        obj?.body?.data?.output,
        obj?.body?.data?.result,
        obj?.body?.data?.content
    ]

    for (const value of candidates) {
        const text = normalizeMaybeString(value)
        if (text) return text
    }

    return ''
}

function normalizeWebhookResult(raw) {
    const data = Array.isArray(raw) ? raw[0] : raw

    // If the webhook explicitly reports failure, surface its error text.
    if (data?.success === false) {
        const errorText =
            normalizeMaybeString(data?.error) ||
            normalizeMaybeString(data?.message) ||
            normalizeMaybeString(data?.data?.error) ||
            normalizeMaybeString(data?.data?.message)

        return { success: false, response: errorText || 'Chat request failed' }
    }

    const responseText = pickFirstTextCandidate(data)
    if (responseText) {
        return {
            success: data?.success ?? true,
            response: responseText,
            timestamp: data?.timestamp
        }
    }

    // Some workflows return the assistant output as `message`.
    const messageText = normalizeMaybeString(data?.message)
    if (messageText) {
        return { success: data?.success ?? true, response: messageText, timestamp: data?.timestamp }
    }

    const fallbackString = normalizeMaybeString(data)
    if (fallbackString) {
        return { success: true, response: fallbackString }
    }

    return { success: data?.success ?? true, response: 'Sorry — I could not generate a response.' }
}

async function postWebhookJson(payload, { signal, timeoutMs = 20000 } = {}) {
    const url = getChatWebhookUrl()
    if (!url) {
        throw new Error('Chat webhook URL is not configured. Set VITE_N8N_CHAT_WEBHOOK_URL (or VITE_N8N_WEBHOOK_URL) in .env.local and restart the dev server.')
    }

    const controller = new AbortController()
    const abortOnTimeout = window.setTimeout(() => controller.abort(), timeoutMs)

    const combinedSignal = (() => {
        if (!signal) return controller.signal
        // If either aborts, fetch aborts.
        const onAbort = () => controller.abort()
        if (signal.aborted) {
            controller.abort()
        } else {
            signal.addEventListener('abort', onAbort, { once: true })
        }
        return controller.signal
    })()

    let response
    try {
        response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: combinedSignal
        })
    } catch (err) {
        if (err?.name === 'AbortError') {
            throw new Error('Chat request timed out. Check your n8n workflow and network connection.')
        }

        // Browser fetch failures commonly show up as TypeError("Failed to fetch") due to CORS or DNS.
        const message = typeof err?.message === 'string' ? err.message : ''
        if (message.toLowerCase().includes('failed to fetch')) {
            throw new Error(`Unable to reach the chat webhook. This is often caused by CORS not being enabled on the n8n webhook response or an incorrect URL. (${url})`)
        }

        throw new Error(message || 'Unable to reach the chat webhook.')
    } finally {
        window.clearTimeout(abortOnTimeout)
    }

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        // Try to extract a useful error string.
        try {
            const parsed = JSON.parse(text)
            const normalized = normalizeWebhookResult(parsed)
            if (normalized?.response) {
                throw new Error(`Webhook failed (${response.status}): ${normalized.response}`)
            }
        } catch {
            // ignore
        }

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

    if (getChatWebhookUrl()) {
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
            throw new Error(normalized?.response || 'Chat request failed')
        }
        return normalized
    }

    // Fallback (demo mode)
    return mockApi.sendChatMessage(trimmed, clinicId, { preferredLanguage })
}
