import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['de', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'de';
    const locale: Locale = SUPPORTED_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'de';

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
