import { useState, useRef } from 'react'
import { Image as ImageIcon, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImagePreview } from './ImagePreview'
import { useSendMessage } from '@/hooks/useMessages'

interface MessageComposerProps {
  leadId: string
  onMessageSent?: () => void
}

export function MessageComposer({ leadId, onMessageSent }: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sendMessage = useSendMessage()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Arquivo deve ser uma imagem')
        return
      }

      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if (!message.trim() && !image) return

    try {
      if (image) {
        // For now, we'll convert to base64 data URL
        // In production, you'd upload to storage first
        const base64 = await fileToBase64(image)

        await sendMessage.mutateAsync({
          lead_id: leadId,
          type: 'image',
          media_url: base64,
          caption: message || null,
        })
      } else {
        await sendMessage.mutateAsync({
          lead_id: leadId,
          type: 'text',
          content: message,
        })
      }

      // Clear form
      setMessage('')
      handleRemoveImage()
      toast.success('Mensagem enviada!')
      onMessageSent?.()
    } catch {
      // Error is already handled by the hook
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = (message.trim() || image) && !sendMessage.isPending

  return (
    <div className="border-t p-4 bg-white">
      {imagePreview && (
        <ImagePreview src={imagePreview} onRemove={handleRemoveImage} />
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendMessage.isPending}
        >
          <ImageIcon className="h-5 w-5 text-gray-500" />
        </Button>

        <Input
          placeholder={image ? 'Adicione uma legenda...' : 'Digite sua mensagem...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sendMessage.isPending}
          className="flex-1"
        />

        <Button onClick={handleSend} disabled={!canSend} size="icon">
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
