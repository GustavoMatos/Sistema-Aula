import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePreviewProps {
  src: string
  onRemove: () => void
}

export function ImagePreview({ src, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative inline-block mb-3">
      <img
        src={src}
        alt="Preview"
        className="max-h-32 rounded-lg border object-cover"
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
