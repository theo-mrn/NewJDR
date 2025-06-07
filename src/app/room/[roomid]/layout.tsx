import { CharacterProvider } from '@/contexts/CharacterContext'

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CharacterProvider>
      {children}
    </CharacterProvider>
  )
} 