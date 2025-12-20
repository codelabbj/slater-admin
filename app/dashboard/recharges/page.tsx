"use client"

import { useState } from "react"
import { useRecharges, type RechargeFilters, type Recharge } from "@/hooks/useRecharges"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Search, Copy, ExternalLink } from "lucide-react"
import { CreateRechargeDialog } from "@/components/create-recharge-dialog"
import { copyToClipboard } from "@/lib/recharge-utils"

export default function RechargesPage() {
  const [filters, setFilters] = useState<RechargeFilters>({
    page: 1,
    page_size: 10,
  })

  const { data: rechargesData, isLoading: rechargesLoading } = useRecharges(filters)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCopyReference = (reference: string) => {
    copyToClipboard(reference)
  }

  const renderPaymentProof = (recharge: Recharge) => {
    if (!recharge.payment_proof) return null

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(recharge.payment_proof, '_blank')}
        className="h-8 w-8 p-0"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Recharges
          </h2>
          <p className="text-muted-foreground">Gérez les demandes de recharge</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Recharge
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="text-lg font-semibold">Filtres</CardTitle>
          <CardDescription className="text-sm">Rechercher et filtrer les recharges</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par référence..."
                  value={filters.search || ""}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recharges Table Card */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Liste des Recharges</CardTitle>
          <CardDescription>Total : {rechargesData?.count || 0} recharges</CardDescription>
        </CardHeader>
        <CardContent>
          {rechargesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rechargesData && rechargesData.results && rechargesData.results.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date de Création</TableHead>
                    <TableHead>Preuve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rechargesData.results.map((recharge) => (
                    <TableRow key={recharge.id}>
                      <TableCell>
                        <Badge variant="default" className="font-mono">
                          {recharge.amount} FCFA
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {recharge.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{recharge.payment_reference}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyReference(recharge.payment_reference)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(recharge.created_at).toLocaleDateString('fr-FR')}</div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(recharge.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderPaymentProof(recharge) || <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {filters.page} sur {Math.ceil((rechargesData?.count || 0) / (filters.page_size || 10))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    disabled={!rechargesData?.previous}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    disabled={!rechargesData?.next}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucune recharge trouvée</div>
          )}
        </CardContent>
      </Card>

      <CreateRechargeDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}
