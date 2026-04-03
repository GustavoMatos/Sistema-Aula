import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { WhatsAppInstance } from '@/lib/api'

interface DeleteInstanceDialogProps {
  instance: WhatsAppInstance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteInstanceDialog({
  instance,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteInstanceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover instância</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover a instância{' '}
            <strong>{instance?.instance_name}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita e a conexão com o WhatsApp será perdida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? 'Removendo...' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
