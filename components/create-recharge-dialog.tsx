"use client"

import { useState, useRef, useEffect } from "react"
import { useCreateRecharge, useUploadPaymentProof, type CreateRechargeInput } from "@/hooks/useRecharges"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react"
import { toast } from "react-hot-toast"

interface CreateRechargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRechargeDialog({ open, onOpenChange }: CreateRechargeDialogProps) {
  const createRecharge = useCreateRecharge()
  const uploadProof = useUploadPaymentProof()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<CreateRechargeInput>({
    amount: "",
    payment_method: "",
    payment_reference: "",
    notes: "",
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string>("")
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (!open) {
      setFormData({
        amount: "",
        payment_method: "",
        payment_reference: "",
        notes: "",
      })
      setUploadedFile(null)
      setUploadedUrl("")
      setPreviewUrl("")
    }
  }, [open])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image")
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Le fichier ne doit pas dépasser 5MB")
      return
    }

    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))

    // Upload the file
    try {
      const result = await uploadProof.mutateAsync(file)
      setUploadedUrl(result.url || result.file_url || result.image_url || "")
      toast.success("Image téléchargée avec succès")
    } catch (error) {
      setUploadedFile(null)
      setPreviewUrl("")
      // Error is already handled in the mutation
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = () => {
    setUploadedFile(null)
    setUploadedUrl("")
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.payment_method || !formData.payment_reference) {
      toast.error("Veuillez remplir tous les champs requis")
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Le montant doit être un nombre positif")
      return
    }

    const submitData: CreateRechargeInput = {
      ...formData,
      amount: amount.toString(),
      payment_proof: uploadedUrl || undefined,
    }

    createRecharge.mutate(submitData, {
      onSuccess: () => {
        onOpenChange(false)
        setFormData({
          amount: "",
          payment_method: "",
          payment_reference: "",
          notes: "",
        })
        setUploadedFile(null)
        setUploadedUrl("")
        setPreviewUrl("")
      },
    })
  }

  const isPending = createRecharge.isPending || uploadProof.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une Recharge</DialogTitle>
          <DialogDescription>
            Ajouter une nouvelle demande de recharge avec preuve de paiement
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="200000"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Méthode de Paiement *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                disabled={isPending}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_reference">Référence de Paiement *</Label>
              <Input
                id="payment_reference"
                type="text"
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                placeholder="Référence de transaction"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplémentaires (optionnel)"
                disabled={isPending}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Preuve de Paiement</Label>
              {!uploadedFile ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner ou glissez-déposez une image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, JPEG - Max 5MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isPending}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {previewUrl && (
                    <div className="mt-3">
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="max-w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.amount || !formData.payment_method || !formData.payment_reference}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
