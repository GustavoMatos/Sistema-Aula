import { useState, useRef } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useImportLeads } from '@/hooks/useLeads'
import type { ImportResult } from '@/lib/api'

interface ImportCSVModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportCSVModal({ open, onOpenChange }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importLeads = useImportLeads()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setResult(null)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    const importResult = await importLeads.mutateAsync(file)
    setResult(importResult)
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onOpenChange(false)
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Leads via CSV</DialogTitle>
          <DialogDescription>
            Faca upload de um arquivo CSV com os leads para importar
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                ${file ? 'bg-green-50 border-green-300' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-green-500" />
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                    className="mt-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover arquivo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-gray-400" />
                  <p className="text-gray-600">
                    Arraste um arquivo CSV aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-400">Maximo 5MB</p>
                </div>
              )}
            </div>

            {/* CSV Format Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-sm text-gray-700 mb-2">
                Formato do CSV esperado:
              </p>
              <code className="text-xs text-gray-600 block bg-white p-2 rounded border">
                name,phone,email,company,source,tags,notes
              </code>
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li>• <strong>name</strong> e <strong>phone</strong> sao obrigatorios</li>
                <li>• Telefone deve incluir DDD (ex: 11999998888)</li>
                <li>• Tags separadas por ponto e virgula (tag1;tag2)</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || importLeads.isPending}
              >
                {importLeads.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium text-green-700">Importacao concluida!</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-xs text-green-600">Importados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                  <p className="text-xs text-yellow-600">Duplicados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-red-600">Erros</p>
                </div>
              </div>
            </div>

            {/* Errors List */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="font-medium text-red-700 text-sm">
                    Erros encontrados:
                  </p>
                </div>
                <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>
                      Linha {error.row}: {error.field} - {error.error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-red-500 font-medium">
                      ...e mais {result.errors.length - 10} erro(s)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Importar outro arquivo
              </Button>
              <Button onClick={handleClose}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
