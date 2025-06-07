import { SelectedCharacterDisplay } from '@/components/SelectedCharacterDisplay'
import { CharacterStatsDisplay } from '@/components/CharacterStatsDisplay'

export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <SelectedCharacterDisplay />
      <CharacterStatsDisplay />
    </div>
  )
}