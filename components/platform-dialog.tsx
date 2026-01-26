"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useCreatePlatform, useUpdatePlatform, type Platform, type PlatformInput } from "@/hooks/usePlatforms"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, X, Eye, EyeOff } from "lucide-react"
import api from "@/lib/axios"
import { toast } from "react-hot-toast"

interface PlatformDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform?: Platform
}

export function PlatformDialog({ open, onOpenChange, platform }: PlatformDialogProps) {
  const createPlatform = useCreatePlatform()
  const updatePlatform = useUpdatePlatform()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<PlatformInput>({
    name: "",
    image: "",
    enable: true,
    hash: null,
    cashdeskid: null,
    cashierpass: null,
    deposit_tuto_link: null,
    withdrawal_tuto_link: null,
    why_withdrawal_fail: null,
    order: null,
    city: null,
    street: null,
    minimun_deposit: 200,
    max_deposit: 100000,
    minimun_with: 300,
    max_win: 1000000,
    active_for_deposit: false,
    active_for_with: false,
  })

  const [preview, setPreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        name: "",
        image: "",
        enable: true,
        hash: null,
        cashdeskid: null,
        cashierpass: null,
        deposit_tuto_link: null,
        withdrawal_tuto_link: null,
        why_withdrawal_fail: null,
        order: null,
        city: null,
        street: null,
        minimun_deposit: 200,
        max_deposit: 100000,
        minimun_with: 300,
        max_win: 1000000,
        active_for_deposit: false,
        active_for_with: false,
      })
      setPreview("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (platform) {
      setFormData({
        name: platform.name,
        image: platform.image,
        enable: platform.enable,
        hash: platform.hash,
        cashdeskid: platform.cashdeskid,
        cashierpass: platform.cashierpass,
        deposit_tuto_link: platform.deposit_tuto_link,
        withdrawal_tuto_link: platform.withdrawal_tuto_link,
        why_withdrawal_fail: platform.why_withdrawal_fail,
        order: platform.order,
        city: platform.city,
        street: platform.street,
        minimun_deposit: platform.minimun_deposit,
        max_deposit: platform.max_deposit,
        minimun_with: platform.minimun_with,
        max_win: platform.max_win,
        active_for_deposit: platform.active_for_deposit ?? false,
        active_for_with: platform.active_for_with ?? false,
      })
      setPreview(platform.image)
    } else {
      setFormData({
        name: "",
        image: "",
        enable: true,
        hash: null,
        cashdeskid: null,
        cashierpass: null,
        deposit_tuto_link: null,
        withdrawal_tuto_link: null,
        why_withdrawal_fail: null,
        order: null,
        city: null,
        street: null,
        minimun_deposit: 200,
        max_deposit: 100000,
        minimun_with: 300,
        max_win: 1000000,
        active_for_deposit: false,
        active_for_with: false,
      })
      setPreview("")
    }
  }, [platform, open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La taille de l'image doit être inférieure à 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await api.post("/mobcash/upload", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const imageUrl = response.data.file
      if (!imageUrl) {
        throw new Error("La réponse de l'API ne contient pas de clé 'file'")
      }
      setFormData({ ...formData, image: imageUrl })
      setPreview(imageUrl)
      toast.success("Image téléchargée avec succès")
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || "Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: "" })
    setPreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const sanitizeData = (data: PlatformInput) => {
      const sanitized = { ...data }
      if (!sanitized.hash || (typeof sanitized.hash === "string" && sanitized.hash.trim() === "")) {
        delete sanitized.hash
      }
      if (
        !sanitized.cashdeskid ||
        (typeof sanitized.cashdeskid === "string" && sanitized.cashdeskid.trim() === "")
      ) {
        delete sanitized.cashdeskid
      }
      if (
        !sanitized.cashierpass ||
        (typeof sanitized.cashierpass === "string" && sanitized.cashierpass.trim() === "")
      ) {
        delete sanitized.cashierpass
      }
      return sanitized
    }

    if (platform) {
      const updateData = sanitizeData(formData)

      updatePlatform.mutate(
        { id: platform.id, data: updateData },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        },
      )
    } else {
      // For create, validate image is uploaded
      if (!formData.image) {
        toast.error("Veuillez télécharger une image")
        return
      }

      const createData = sanitizeData(formData)

      createPlatform.mutate(createData, {
        onSuccess: () => {
          onOpenChange(false)
          setFormData({
            name: "",
            image: "",
            enable: true,
            hash: null,
            cashdeskid: null,
            cashierpass: null,
            deposit_tuto_link: null,
            withdrawal_tuto_link: null,
            why_withdrawal_fail: null,
            order: null,
            city: null,
            street: null,
            minimun_deposit: 200,
            max_deposit: 100000,
            minimun_with: 300,
            max_win: 1000000,
            active_for_deposit: false,
            active_for_with: false,
          })
          setPreview("")
        },
      })
    }
  }

  const isPending = createPlatform.isPending || updatePlatform.isPending || isUploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{platform ? "Modifier la Plateforme" : "Créer une Plateforme"}</DialogTitle>
          <DialogDescription>
            {platform ? "Modifiez les détails de la plateforme ci-dessous." : "Ajoutez une nouvelle plateforme de paris au système."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                  disabled={isPending}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {preview ? "Changer l'image" : "Télécharger une image"}
                      </>
                    )}
                  </Button>
                  {preview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRemoveImage}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {preview && (
                  <div className="relative mt-2">
                    <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded-md border" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hash">Hash</Label>
              <Input
                id="hash"
                value={formData.hash || ""}
                onChange={(e) => setFormData({ ...formData, hash: e.target.value || null })}
                placeholder="abc123hashvalue"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashdeskid">Cashdesk ID</Label>
              <Input
                id="cashdeskid"
                value={formData.cashdeskid || ""}
                onChange={(e) => setFormData({ ...formData, cashdeskid: e.target.value || null })}
                placeholder="cashdesk_001"
                disabled={isPending}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashierpass">Cashier Password</Label>
              <div className="relative">
                <Input
                  id="cashierpass"
                  type={showPassword ? "text" : "password"}
                  value={formData.cashierpass || ""}
                  onChange={(e) => setFormData({ ...formData, cashierpass: e.target.value || null })}
                  placeholder="securePass@123"
                  disabled={isPending}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Rue</Label>
              <Input
                id="street"
                value={formData.street || ""}
                onChange={(e) => setFormData({ ...formData, street: e.target.value || null })}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimun_deposit">Dépôt Minimum *</Label>
              <Input
                id="minimun_deposit"
                type="number"
                value={formData.minimun_deposit}
                onChange={(e) => setFormData({ ...formData, minimun_deposit: Number.parseInt(e.target.value) })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_deposit">Dépôt Maximum *</Label>
              <Input
                id="max_deposit"
                type="number"
                value={formData.max_deposit}
                onChange={(e) => setFormData({ ...formData, max_deposit: Number.parseInt(e.target.value) })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimun_with">Retrait Minimum *</Label>
              <Input
                id="minimun_with"
                type="number"
                value={formData.minimun_with}
                onChange={(e) => setFormData({ ...formData, minimun_with: Number.parseInt(e.target.value) })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_win">Gain Maximum *</Label>
              <Input
                id="max_win"
                type="number"
                value={formData.max_win}
                onChange={(e) => setFormData({ ...formData, max_win: Number.parseInt(e.target.value) })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Ordre</Label>
              <Input
                id="order"
                type="number"
                value={formData.order || ""}
                onChange={(e) =>
                  setFormData({ ...formData, order: e.target.value ? Number.parseInt(e.target.value) : null })
                }
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="enable">Activer</Label>
              <Switch
                id="enable"
                checked={formData.enable}
                onCheckedChange={(checked) => setFormData({ ...formData, enable: checked })}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="active_for_deposit">Actif pour Dépôt</Label>
              <Switch
                id="active_for_deposit"
                checked={formData.active_for_deposit}
                onCheckedChange={(checked) => setFormData({ ...formData, active_for_deposit: checked })}
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="active_for_with">Actif pour Retrait</Label>
              <Switch
                id="active_for_with"
                checked={formData.active_for_with}
                onCheckedChange={(checked) => setFormData({ ...formData, active_for_with: checked })}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit_tuto_link">Lien Tutoriel Dépôt</Label>
            <Input
              id="deposit_tuto_link"
              value={formData.deposit_tuto_link || ""}
              onChange={(e) => setFormData({ ...formData, deposit_tuto_link: e.target.value || null })}
              placeholder="https://..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal_tuto_link">Lien Tutoriel Retrait</Label>
            <Input
              id="withdrawal_tuto_link"
              value={formData.withdrawal_tuto_link || ""}
              onChange={(e) => setFormData({ ...formData, withdrawal_tuto_link: e.target.value || null })}
              placeholder="https://..."
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="why_withdrawal_fail">Lien Aide Échec Retrait</Label>
            <Input
              id="why_withdrawal_fail"
              value={formData.why_withdrawal_fail || ""}
              onChange={(e) => setFormData({ ...formData, why_withdrawal_fail: e.target.value || null })}
              placeholder="https://..."
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {platform ? "Mise à jour..." : "Création..."}
                </>
              ) : platform ? (
                "Mettre à jour la Plateforme"
              ) : (
                "Créer la Plateforme"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
