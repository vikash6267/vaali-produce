"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { RootState } from "@/redux/store"
import { useSelector } from "react-redux"
import{updateOrderPaymentAPI} from "@/services2/operations/order"

interface PaymentStatusPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fetchOrders: () => void
  onPayment: (id:string) => void

  orderId: string
  id:string
  totalAmount: number
}

interface PaymentData {
  orderId: string
  id: string
  method: "cash" | "creditcard" |"cheque"
  transactionId?: string
  notes?: string
}

export function PaymentStatusPopup({ open, onOpenChange, orderId, totalAmount ,id,fetchOrders,onPayment}: PaymentStatusPopupProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "creditcard" | "cheque">("cash")
  const [transactionId, setTransactionId] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const token = useSelector((state: RootState) => state.auth?.token ?? null)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Validate form based on payment method
      if (paymentMethod === "cash" && !notes.trim()) {
        toast({
          title: "Notes required",
          description: "Please provide notes for cash payment",
          variant: "destructive",
        })
        return
      }

      if (paymentMethod === "creditcard" && !transactionId.trim()) {
        toast({
          title: "Transaction ID required",
          description: "Please provide transaction ID for credit card payment",
          variant: "destructive",
        })
        return
      }

      const paymentData: PaymentData = {
        orderId,
        id,
        method: paymentMethod,
        ...(paymentMethod === "creditcard" && { transactionId }),
        ...(paymentMethod === "cash" && { notes }),
        ...(paymentMethod === "cheque" && { notes }),
      }

      console.log(paymentData)

       await updateOrderPaymentAPI(paymentData,token,id)

      toast({
        title: "Payment status updated",
        description: `Order #${orderId} payment has been updated successfully.`,
      })

      // Reset form
      onPayment(id)
      // await fetchOrders()
      setTransactionId("")
      setNotes("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogDescription>Update payment details for order #{orderId}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="order-id" className="text-right">
              Order ID
            </Label>
            <Input id="order-id" value={orderId} className="col-span-3" readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
          <Input id="amount" value={`$${totalAmount.toFixed(2)}`} className="col-span-3" readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "cash" | "creditcard")}
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="creditcard" id="creditcard" />
                <Label htmlFor="creditcard">Credit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cheque" id="cheque" />
                <Label htmlFor="cheque">Cheque</Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "creditcard" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-id" className="text-right">
                Transaction ID
              </Label>
              <Input
                id="transaction-id"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="col-span-3"
                placeholder="Enter transaction ID"
              />
            </div>
          )}

          {(paymentMethod === "cash" || paymentMethod === "cheque")  && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Enter payment notes"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Check className="mr-2 h-4 w-4" />
            {isSubmitting ? "Updating..." : "Update Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
