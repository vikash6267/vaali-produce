"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Receipt } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/data"

interface CreditMemoFormProps {
  open: boolean
  onClose: () => void
  order: any
  token: string
  onSuccess?: () => void
}

interface CreditMemoItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
  reason: string
}

export default function CreditMemoForm({ open, onClose, order, token, onSuccess }: CreditMemoFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Credit Memo Form State
  const [creditMemoData, setCreditMemoData] = useState({
    creditMemoNumber: `CM-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
    refundMethod: "store_credit",
    totalAmount: 0,
  })

  const [creditItems, setCreditItems] = useState<CreditMemoItem[]>([])

  // Add item to credit memo
  const addCreditItem = (item: any) => {
    const existingItem = creditItems.find((ci) => ci.productId === item.product)

    if (existingItem) {
      setCreditItems(
        creditItems.map((ci) =>
          ci.productId === item.product
            ? { ...ci, quantity: ci.quantity + 1, total: (ci.quantity + 1) * ci.unitPrice }
            : ci,
        ),
      )
    } else {
      const newItem: CreditMemoItem = {
        productId: item.product || item.productId,
        productName: item.name || item.productName,
        quantity: 1,
        unitPrice: item.price || item.unitPrice,
        total: item.price || item.unitPrice,
        reason: "defective",
      }
      setCreditItems([...creditItems, newItem])
    }

    updateTotalAmount()
  }

  // Remove item from credit memo
  const removeCreditItem = (productId: string) => {
    setCreditItems(creditItems.filter((item) => item.productId !== productId))
    updateTotalAmount()
  }

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    setCreditItems(
      creditItems.map((item) =>
        item.productId === productId ? { ...item, quantity, total: quantity * item.unitPrice } : item,
      ),
    )
    updateTotalAmount()
  }

  // Update item reason
  const updateItemReason = (productId: string, reason: string) => {
    setCreditItems(creditItems.map((item) => (item.productId === productId ? { ...item, reason } : item)))
  }

  // Calculate total amount
  const updateTotalAmount = () => {
    const total = creditItems.reduce((sum, item) => sum + item.total, 0)
    setCreditMemoData((prev) => ({ ...prev, totalAmount: total }))
  }

  // Submit credit memo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (creditItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the credit memo",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const creditMemoPayload = {
        ...creditMemoData,
        orderId: order._id,
        orderNumber: order.orderNumber || order.id,
        customerId: order.store?._id,
        customerName: order.store?.storeName,
        items: creditItems,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      // API call to save credit memo
      const response = await fetch("/api/credit-memos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(creditMemoPayload),
      })

      if (!response.ok) {
        throw new Error("Failed to create credit memo")
      }

      const result = await response.json()

      toast({
        title: "Credit Memo Created",
        description: `Credit memo ${creditMemoData.creditMemoNumber} has been created successfully`,
      })

      onSuccess?.()
      onClose()

      // Reset form
      setCreditMemoData({
        creditMemoNumber: `CM-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        reason: "",
        notes: "",
        refundMethod: "store_credit",
        totalAmount: 0,
      })
      setCreditItems([])
    } catch (error) {
      console.error("Error creating credit memo:", error)
      toast({
        title: "Error",
        description: "Failed to create credit memo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Create Credit Memo - Order {order?.orderNumber || order?.id}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Credit Memo Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credit Memo Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditMemoNumber">Credit Memo Number</Label>
                <Input
                  id="creditMemoNumber"
                  value={creditMemoData.creditMemoNumber}
                  onChange={(e) => setCreditMemoData((prev) => ({ ...prev, creditMemoNumber: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={creditMemoData.date}
                  onChange={(e) => setCreditMemoData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundMethod">Refund Method</Label>
                <Select
                  value={creditMemoData.refundMethod}
                  onValueChange={(value) => setCreditMemoData((prev) => ({ ...prev, refundMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                    <SelectItem value="cash_refund">Cash Refund</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="original_payment">Original Payment Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Overall Reason</Label>
                <Input
                  id="reason"
                  value={creditMemoData.reason}
                  onChange={(e) => setCreditMemoData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Defective products, Customer complaint"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Items Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Items for Credit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order?.items?.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.name || item.productName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(item.price || item.unitPrice)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addCreditItem(item)}
                          disabled={creditItems.some((ci) => ci.productId === (item.product || item.productId))}
                        >
                          {creditItems.some((ci) => ci.productId === (item.product || item.productId))
                            ? "Added"
                            : "Add"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Items */}
          {creditItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credit Memo Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditItems.map((item, index) => (
                    <div key={item.productId} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Product</Label>
                          <p className="font-medium">{item.productName}</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.productId, Number.parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`reason-${index}`}>Reason</Label>
                          <Select
                            value={item.reason}
                            onValueChange={(value) => updateItemReason(item.productId, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="defective">Defective</SelectItem>
                              <SelectItem value="damaged">Damaged</SelectItem>
                              <SelectItem value="wrong_item">Wrong Item</SelectItem>
                              <SelectItem value="customer_complaint">Customer Complaint</SelectItem>
                              <SelectItem value="quality_issue">Quality Issue</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Total</Label>
                            <p className="font-medium">{formatCurrency(item.total)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCreditItem(item.productId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total Credit Amount: {formatCurrency(creditMemoData.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={creditMemoData.notes}
                onChange={(e) => setCreditMemoData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes or comments about this credit memo..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || creditItems.length === 0}>
              {loading ? "Creating..." : "Create Credit Memo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
