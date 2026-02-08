export type ThemeKey =
  | "lavanda-atelie"
  | "cha-de-hortela"
  | "algodao-doce"
  | "terra-cotta"
  | "noite-criativa"

export const THEME_OPTIONS: {
  key: ThemeKey
  name: string
  description: string
  colors: {
    primary: string
    accent: string
    background: string
    card: string
    border: string
  }
}[] = [
  {
    key: "lavanda-atelie",
    name: "Lavanda Ateliê",
    description: "Tema oficial com lilás premium e dourado suave.",
    colors: {
      primary: "#8A72D8",
      accent: "#E6A44B",
      background: "#FDFBFA",
      card: "#FFFFFF",
      border: "#E6DFD9",
    },
  },
  {
    key: "cha-de-hortela",
    name: "Chá de Hortelã",
    description: "Refrescante e leve, com toque artesanal.",
    colors: {
      primary: "#1D9A8A",
      accent: "#F5A623",
      background: "#F6FFFC",
      card: "#FFFFFF",
      border: "#D8EEE9",
    },
  },
  {
    key: "algodao-doce",
    name: "Algodão Doce",
    description: "Delicado e acolhedor para ateliês criativos.",
    colors: {
      primary: "#E29AB2",
      accent: "#FFBED5",
      background: "#FFF6FA",
      card: "#FFFFFF",
      border: "#F1D7DF",
    },
  },
  {
    key: "terra-cotta",
    name: "Terra Cotta",
    description: "Quente e elegante, inspirado em materiais naturais.",
    colors: {
      primary: "#C78A50",
      accent: "#F2C48D",
      background: "#FFF7ED",
      card: "#FFFFFF",
      border: "#E9D9C8",
    },
  },
  {
    key: "noite-criativa",
    name: "Noite Criativa",
    description: "Moderno e sofisticado para produção noturna.",
    colors: {
      primary: "#375BA3",
      accent: "#6FC9FF",
      background: "#F4F7FF",
      card: "#FFFFFF",
      border: "#DCE5FF",
    },
  },
]

export const DEFAULT_THEME: ThemeKey = "lavanda-atelie"

const legacyThemeMap: Record<string, ThemeKey> = {
  indigo: "lavanda-atelie",
  rose: "algodao-doce",
  emerald: "cha-de-hortela",
  slate: "noite-criativa",
}

export const resolveThemeKey = (value?: string | null): ThemeKey => {
  if (!value) return DEFAULT_THEME
  if (legacyThemeMap[value]) return legacyThemeMap[value]
  const theme = THEME_OPTIONS.find((option) => option.key === value)?.key
  return theme ?? DEFAULT_THEME
}
