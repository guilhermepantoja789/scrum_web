// Local: components/ui/Icon.tsx

"use client"

import { icons } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// Este é um tipo que nos permite usar os nomes dos ícones como strings
type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
    name: IconName;
}

export const Icon = ({ name, ...props }: IconProps) => {
    const LucideIcon = icons[name];

    if (!LucideIcon) {
        return null; // Retorna nulo se o nome do ícone for inválido
    }

    return <LucideIcon {...props} />;
};