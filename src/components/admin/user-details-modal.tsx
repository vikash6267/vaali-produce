"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { User, ShoppingBag, MapPin, Phone, Mail, Store, User2 } from 'lucide-react'

interface UserDetailsProps {
  isOpen: boolean
  onClose: () => void
  userData: {
    _id: string
    totalOrders: number
    totalSpent: number
    user: {
      _id: string
      email: string
      phone: string
      storeName: string
      ownerName: string
      address: string
      city: string
      state: string
      zipCode: string
      businessDescription: string
      role: string
      createdAt: string
    }
  } | null
}

const UserDetailsModal = ({ isOpen, onClose, userData }: UserDetailsProps) => {
  if (!userData) return null

  const { totalOrders, totalSpent, user } = userData
  const formattedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Store Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Store Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span>Store Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>Store Name</span>
                </div>
                <p className="font-medium">{user?.storeName || "N/A"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User2 className="h-4 w-4" />
                  <span>Owner Name</span>
                </div>
                <p className="font-medium">{user?.ownerName || "N/A"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="font-medium">{user?.email || "N/A"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </div>
                <p className="font-medium">{user?.phone || "N/A"}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Role</span>
                </div>
                <Badge variant="outline" className="capitalize">{user?.role || "N/A"}</Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Member Since</span>
                </div>
                <p className="font-medium">{formattedDate}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Address & Order Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{user?.address || "N/A"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.city || "N/A"}, {user?.state || "N/A"} {user?.zipCode || "N/A"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span>Order Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {user?.businessDescription && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Business Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{user.businessDescription}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UserDetailsModal
