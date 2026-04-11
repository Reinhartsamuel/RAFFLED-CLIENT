export function safeBigInt(value: string | undefined | null): bigint {
    try {
        const s = String(value ?? '0').trim()
        // If it's a decimal string (e.g. "1.5"), truncate to integer part
        return BigInt(s.includes('.') ? s.split('.')[0] : s || '0')
    } catch {
        return 0n
    }
}