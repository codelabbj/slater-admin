"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/axios"
import { toast } from "react-hot-toast"

// Recharge Types
export interface Recharge {
  id: number
  created_by: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  amount: string
  payment_method: string
  payment_reference: string
  notes: string
  payment_proof: string | null
  created_at: string
}

export interface RechargesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Recharge[]
}

export interface RechargeFilters {
  page?: number
  page_size?: number
  search?: string
}

export interface CreateRechargeInput {
  amount: string
  payment_method: string
  payment_reference: string
  notes: string
  payment_proof?: string
}

export function useRecharges(filters: RechargeFilters = {}) {
  return useQuery({
    queryKey: ["recharges", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (filters.page) params.page = filters.page
      if (filters.page_size) params.page_size = filters.page_size
      if (filters.search) params.search = filters.search

      const res = await api.get<RechargesResponse>("/mobcash/recharge-mobcash-balance", { params })
      return res.data
    },
  })
}

export function useCreateRecharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRechargeInput) => {
      const res = await api.post("/mobcash/recharge-mobcash-balance", data)
      return res.data
    },
    onSuccess: () => {
      toast.success("Demande de recharge créée avec succès!")
      queryClient.invalidateQueries({ queryKey: ["recharges"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Erreur lors de la création de la recharge")
    },
  })
}

export function useUploadPaymentProof() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const res = await api.post("/mobcash/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return res.data
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Erreur lors du téléchargement du fichier")
    },
  })
}
