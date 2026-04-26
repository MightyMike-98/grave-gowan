const COFOUNDER_USER_IDS: readonly string[] = [
    'b736db42-d98c-41eb-8649-552bb42c316c',
    'fc9c9b6d-ac8a-4a26-991f-0d5f9b656763',
    '965aad31-b36f-4888-9603-b9bf9d6f223e',
    'cb2a28bc-e481-4553-8b1f-27dcd6a174cb',
];

export function isCofounder(userId: string | null | undefined): boolean {
    if (!userId) return false;
    return COFOUNDER_USER_IDS.includes(userId);
}
